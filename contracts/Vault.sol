// SPDX-License-Identifier: MIT
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Router.sol";
import "./interfaces/IRouter.sol";
import "./MasterChef.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

pragma solidity ^0.6.12;

contract Vault  {
    using SafeERC20 for IERC20;
    struct RouteInfo {
        address router;
        address[] path;
    }
    uint256 internal constant RATIO_PRECISION = 1000000; // 6 decimals
    uint256 public swapTimeout;
    uint256 public slippage = 50000; // 0.5%
    mapping(address => mapping(address => RouteInfo)) public routes;

    MasterChef public masterChef;
    address public liquidityRouter;
    uint256 public poolId;
    address public wantAddress;
    address public rewardToken;
    address public token0;
    address public token1;
    address public router;
    

    constructor(
        address _liquidityRouter,
        MasterChef _masterChef,
        uint256 _poolId,
        address _router
    ) public {
        router = _router;
        liquidityRouter = _liquidityRouter;
        poolId = _poolId;
        masterChef = _masterChef;
        (IERC20 _wantAddress, , , ) = _masterChef.poolInfo(poolId);
        wantAddress = address(_wantAddress);
        rewardToken = address(_masterChef.sushi());
        token0 = IUniswapV2Pair(wantAddress).token0();
        token1 = IUniswapV2Pair(wantAddress).token1();
        _syncSwapRoutes();
    }

      function _syncSwapRoutes() public {
        _addRouteInfo(rewardToken, token0);
        _addRouteInfo(rewardToken, token1);
        _addRouteInfo(token0, rewardToken);
        _addRouteInfo(token1, rewardToken);
    }

    function _addRouteInfo(address _from, address _to) internal {
        if (_from != _to) {
            (address _router, address[] memory _path) = getRouter().getSwapRoute(_from, _to);
            require(_from != address(0), "Src token is invalid");
            require(_to != address(0), "Dst token is invalid");
            require(_router != address(0), "Router is invalid");
            require(_path[0] == _from, "Route must start with src token");
            require(_path[_path.length - 1] == _to, "Route must end with dst token");
            routes[_from][_to] = RouteInfo(_router, _path);
        }
    }

    function getRouter() public view virtual returns (IRouter) {
        return IRouter(router);
    }

    function deposit(uint256 _wantAmt) public returns (uint256) {
        IERC20(wantAddress).safeTransferFrom(address(msg.sender), address(this), _wantAmt);
        _depositToFarm();
        return _wantAmt;
    }

    function _depositToFarm() public {
        IERC20 wantToken = IERC20(wantAddress); // get LP token
        uint256 wantAmt = wantToken.balanceOf(address(this)); // get total amount in my vault contract
        wantToken.safeIncreaseAllowance(address(masterChef), wantAmt);
        masterChef.deposit(poolId, wantAmt);
        // emit Deposited(wantAmt);
    }

    function balanceInFarm() public view returns (uint256) {
        (uint256 _amount, ) = masterChef.userInfo(poolId, address(this));
        return _amount;
    }

    function _getSwapRoute(address _fromToken, address _toToken) internal view returns (address _router, address[] memory _path) {
        RouteInfo storage _info = routes[_fromToken][_toToken];
        _router = _info.router;
        _path = _info.path;
    }

    function _swap(
        address _inputToken,
        address _outputToken,
        uint256 _inputAmount
    ) internal {
        if (_inputAmount == 0) {
            return;
        }
        (address _router, address[] memory _path) = _getSwapRoute(_inputToken, _outputToken);
        require(_router != address(0), "invalid route");
        require(_path[0] == _inputToken, "Route must start with src token");
        require(_path[_path.length - 1] == _outputToken, "Route must end with dst token");
        IERC20(_inputToken).safeApprove(_router, 0);
        IERC20(_inputToken).safeApprove(_router, _inputAmount);
        _safeSwap(_router, _inputAmount, slippage, _path, address(this), block.timestamp + swapTimeout);
    }

    function _safeSwap(
        address _swapRouterAddress,
        uint256 _amountIn,
        uint256 _slippage,
        address[] memory _path,
        address _to,
        uint256 _deadline
    ) internal {
        IUniswapV2Router _swapRouter = IUniswapV2Router(_swapRouterAddress);
        require(_path.length > 0, "invalidSwapPath");
        uint256[] memory amounts = _swapRouter.getAmountsOut(_amountIn, _path);
        uint256 _minAmountOut = (amounts[amounts.length - 1] * (RATIO_PRECISION - _slippage)) / RATIO_PRECISION;

        _swapRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(_amountIn, _minAmountOut, _path, _to, _deadline);
    }

    function _payBackRemainRewardForNextTime() internal {
        // Converts dust tokens into earned tokens, which will be reinvested on the next earn().
        // Converts token0 dust (if any) to earned tokens
        uint256 token0Amt = IERC20(token0).balanceOf(address(this));
        if (token0 != rewardToken && token0Amt > 0) {
            _swap(token0, rewardToken, token0Amt);
        }

        // Converts token1 dust (if any) to earned tokens
        uint256 token1Amt = IERC20(token1).balanceOf(address(this));
        if (token1 != rewardToken && token1Amt > 0) {
            _swap(token1, rewardToken, token1Amt);
        }
    }

    function compound() public {
        // Harvest farm tokens
        uint256 _initBalance = balanceInFarm(); // get my amount LP token in Pool
        masterChef.withdraw(poolId, 0); // Claim thưởng về vault balance

        // Converts reward into LP tokens
        uint256 earnedAmt = IERC20(rewardToken).balanceOf(address(this)); // lấy phần thưởng 
        if (rewardToken != token0) {
            _swap(rewardToken, token0, earnedAmt / 2);
        }

        if (rewardToken != token1) {
            _swap(rewardToken, token1, earnedAmt / 2);
        }

        IERC20 _token0 = IERC20(token0);
        IERC20 _token1 = IERC20(token1);

        // Get 2 type LP tokens from Reward, now add liquidity
        uint256 token0Amt = _token0.balanceOf(address(this));
        uint256 token1Amt = _token1.balanceOf(address(this));
        
        if (token0Amt > 0 && token1Amt > 0) {
            _token0.safeIncreaseAllowance(liquidityRouter, token0Amt);
            _token1.safeIncreaseAllowance(liquidityRouter, token1Amt);
            IUniswapV2Router(liquidityRouter).addLiquidity(
                token0,
                token1,
                token0Amt,
                token1Amt,
                0,
                0,
                address(this),
                block.timestamp + swapTimeout
            );
        }

        _depositToFarm();
        _payBackRemainRewardForNextTime();

        // uint256 _afterBalance = balanceInFarm();
        // if (_afterBalance > _initBalance) {
        //     emit Earned(wantAddress, _afterBalance - _initBalance);
        // } else {
        //     emit Earned(wantAddress, 0);
        // }
    }

    function withdrawAll() public returns (uint256 _withdrawBalance) {
        uint256 _balance = balanceInFarm();
        _withdrawBalance = withdraw(_balance);
        _payBackRemainRewardForNextTime();
        _withdrawFromVault();
        // emit Exit(_withdrawBalance);
    }


    function withdraw(uint256 _wantAmt) public  returns (uint256) {
        require(_wantAmt > 0, "_wantAmt <= 0");
        masterChef.withdraw(poolId, _wantAmt); // vault rút token khỏi matterchef
        uint256 _balance = IERC20(rewardToken).balanceOf(address(this));
        _withdrawFromVault(); // user rút token khỏi vautl
        return _balance;
    }

    
    function _withdrawFromVault() internal {
        uint256 _dustRewardBal = IERC20(rewardToken).balanceOf(address(this));
        if (_dustRewardBal > 0) {
            IERC20(rewardToken).safeTransfer(msg.sender, _dustRewardBal);
        }
        uint256 _wantBalance = IERC20(wantAddress).balanceOf(address(this));
        if (_wantBalance > 0) {
            IERC20(wantAddress).safeTransfer(msg.sender, _wantBalance);
        }
    }
}

