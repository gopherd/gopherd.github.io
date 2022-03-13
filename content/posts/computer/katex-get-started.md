---
title: "Katex 初步"
date: 2022-03-13
abstract: "介绍数学公式库 katex 的使用"
keywords: ["math", "tex", "katex"]
---

## 1. 如何在 hugo 中使用 Katex

### 1.1. 行内公式，在公式首尾加上 `$` 符号，比如：

+ 爱因斯坦质能转换方程 `$E=mc^2$`: $E=mc^2$
+ 一元二次方程的根式解 `$x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}$`: $x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}$

### 1.2. 独立行公式，可以使用 `{{</* math */>}}` 和 `{{</* /math */>}}` 包裹，比如：

```text
{{</* math */>}}
x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}
{{</* /math */>}}

{{</* math */>}}
\sum_{i=0}^{n}{x}
{{</* /math */>}}

{{</* math */>}}
\int_{0}^{\frac{\pi}{2}}{x^2}{dx}
{{</* /math */>}}
```

{{< math >}}
x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}
{{< /math >}}

{{< math >}}
\sum_{i=0}^{n}{x}
{{< /math >}}

{{< math >}}
\int_{0}^{\frac{\pi}{2}}{x^2}{dx}
{{< /math >}}

公式中 `\frac`, `\pm`, `\sqrt` 等以 `\` 开头的函数用于输出特定的符号。更多的函数支持参见 [https://katex.org/docs/supported.html](https://katex.org/docs/supported.html)

## 2. 常见符号的使用

### 2.1. 分号`\frac`，根号 `\sqrt`

分号函数一般后接两个参数，表示分子和分母 `\frac{x}{y}`: $\frac{x}{y}$.

根号后面接一个参数为里面的内容 `\sqrt{x^2+y^2}`: $\sqrt{x^2+y^2}$.

### 2.2. 上标 `_`，下标 `^`

上下标的表示很简单，比如：

* `x^i`: $x^i$
* `x_i`: $x_i$
* `x_i^j`: $x_i^j$
* `x_{ij}`: $x_{ij}$

### 2.3. 矩阵

矩阵存在多种括号模式，包括圆括号 `()`，中括号 `[]`，花括号 `{}`，竖线 `||`，甚至没有括号等。

```text
{{</* math */>}}
\begin{matrix}
   a & b \\
   c & d
\end{matrix}

\quad

\begin{pmatrix}
   a & b \\
   c & d
\end{pmatrix}

\quad

\begin{bmatrix}
   a & b \\
   c & d
\end{bmatrix}

\quad

\begin{Bmatrix}
   a & b \\
   c & d
\end{Bmatrix}

\quad

\begin{vmatrix}
   a & b \\
   c & d
\end{vmatrix}

\quad

\begin{Vmatrix}
   a & b \\
   c & d
\end{Vmatrix}
{{</* /math */>}}
```

{{< math >}}
\begin{matrix}
   a & b \\
   c & d
\end{matrix}

\quad

\begin{pmatrix}
   a & b \\
   c & d
\end{pmatrix}

\quad

\begin{bmatrix}
   a & b \\
   c & d
\end{bmatrix}

\quad

\begin{Bmatrix}
   a & b \\
   c & d
\end{Bmatrix}

\quad

\begin{vmatrix}
   a & b \\
   c & d
\end{vmatrix}

\quad

\begin{Vmatrix}
   a & b \\
   c & d
\end{Vmatrix}
{{< /math >}}

> 上面的公式中 `\quad` 在公式之间插入空白。上面若干种矩阵符号仅有名称不同: `matrix`, `pmatrix`, `bmatrix`, `Bmatrix`, `vmatrix`, `Vmatrix`。

一个 mxn 矩阵可表示如下:

```text
{{</* math */>}}
\begin{bmatrix}
   a_{11} & a_{12} & \cdots & a_{1n} \\
   a_{21} & a_{22} & \cdots & a_{2n} \\
   \vdots & \vdots &        & \vdots \\
   a_{m1} & a_{m2} & \cdots & a_{mn} \\
\end{bmatrix}

\quad{或}\quad

{{</* math */>}}
\begin{bmatrix}
   a_{11} & a_{12} & \cdots & a_{1j} & \cdots & a_{1n} \\
   a_{21} & a_{22} & \cdots & a_{2j} & \cdots & a_{2n} \\
   \vdots & \vdots & \ddots & \vdots & \ddots & \vdots \\
   a_{i1} & a_{i2} & \cdots & a_{ij} & \cdots & a_{in} \\
   \vdots & \vdots & \ddots & \vdots & \ddots & \vdots \\
   a_{m1} & a_{m2} & \cdots & a_{mn} & \cdots & a_{mn} \\
\end{bmatrix}
{{</* /math */>}}
```

{{< math >}}
\begin{bmatrix}
   a_{11} & a_{12} & \cdots & a_{1n} \\
   a_{21} & a_{22} & \cdots & a_{2n} \\
   \vdots & \vdots &        & \vdots \\
   a_{m1} & a_{m2} & \cdots & a_{mn} \\
\end{bmatrix}

\quad{或}\quad

\begin{bmatrix}
   a_{11} & a_{12} & \cdots & a_{1j} & \cdots & a_{1n} \\
   a_{21} & a_{22} & \cdots & a_{2j} & \cdots & a_{2n} \\
   \vdots & \vdots & \ddots & \vdots & \ddots & \vdots \\
   a_{i1} & a_{i2} & \cdots & a_{ij} & \cdots & a_{in} \\
   \vdots & \vdots & \ddots & \vdots & \ddots & \vdots \\
   a_{m1} & a_{m2} & \cdots & a_{mn} & \cdots & a_{mn} \\
\end{bmatrix}
{{< /math >}}
