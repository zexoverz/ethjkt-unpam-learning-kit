// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ISimpleAMM {
    function tokenA() external view returns (address);
    function tokenB() external view returns (address);
    function reserveA() external view returns (uint256);
    function reserveB() external view returns (uint256);
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        external
        pure
        returns (uint256);
    function swapAforB(uint256 amountIn) external returns (uint256 amountOut);
    function swapBforA(uint256 amountIn) external returns (uint256 amountOut);
}

contract SimpleRouter {
    event RoutedSwap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    function getAmountsOut(
        uint256 amountIn,
        address[] calldata pools,
        address[] calldata path
    ) external view returns (uint256[] memory amounts) {
        require(amountIn > 0, "input nol");
        require(path.length >= 2, "path pendek");
        require(pools.length == path.length - 1, "panjang beda");

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        for (uint256 i = 0; i < pools.length; i++) {
            ISimpleAMM pool = ISimpleAMM(pools[i]);
            (uint256 reserveIn, uint256 reserveOut) =
                _reservesFor(pool, path[i], path[i + 1]);
            amounts[i + 1] = pool.getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata pools,
        address[] calldata path
    ) external returns (uint256 amountOut) {
        require(amountIn > 0, "input nol");
        require(path.length >= 2, "path pendek");
        require(pools.length == path.length - 1, "panjang beda");

        require(
            IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn),
            "transfer input gagal"
        );

        uint256 currentAmount = amountIn;

        for (uint256 i = 0; i < pools.length; i++) {
            ISimpleAMM pool = ISimpleAMM(pools[i]);
            address tokenIn = path[i];
            address tokenOut = path[i + 1];

            bool aToB = _isAtoB(pool, tokenIn, tokenOut);

            require(IERC20(tokenIn).approve(pools[i], currentAmount), "approve gagal");

            if (aToB) {
                currentAmount = pool.swapAforB(currentAmount);
            } else {
                currentAmount = pool.swapBforA(currentAmount);
            }
        }

        require(currentAmount >= amountOutMin, "slippage");
        require(
            IERC20(path[path.length - 1]).transfer(msg.sender, currentAmount),
            "transfer output gagal"
        );

        amountOut = currentAmount;
        emit RoutedSwap(msg.sender, path[0], path[path.length - 1], amountIn, amountOut);
    }

    function _isAtoB(
        ISimpleAMM pool,
        address tokenIn,
        address tokenOut
    ) internal view returns (bool) {
        address tokenA = pool.tokenA();
        address tokenB = pool.tokenB();

        if (tokenIn == tokenA && tokenOut == tokenB) return true;
        if (tokenIn == tokenB && tokenOut == tokenA) return false;

        revert("pool bukan pair path");
    }

    function _reservesFor(
        ISimpleAMM pool,
        address tokenIn,
        address tokenOut
    ) internal view returns (uint256 reserveIn, uint256 reserveOut) {
        bool aToB = _isAtoB(pool, tokenIn, tokenOut);

        if (aToB) {
            return (pool.reserveA(), pool.reserveB());
        }

        return (pool.reserveB(), pool.reserveA());
    }
}
