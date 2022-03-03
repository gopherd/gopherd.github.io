网站: [gopherd.com](gopherd.com)
================================

撰写说明
--------

### 代码块标注

通过 markdown 的代码块语法可以在网站中使用代码块，并且在语言参数后面可以添加代码块标注参数，格式如下:

```
lang {[code="[program]+<modes>[,<tags>]"] [html attributes added to hightlight element]}
```

* code.program 可选，指定该段代码所属程序，相同语言的相同程序的所有代码在运行时会被合并在一起。

* code.modes 指定代码模式，是以下选项的组合：
	- `b`: 错误且会被忽略的代码
	- `e`: 错误但不可忽略的代码
	- `x`: 可执行的代码
	- `w`: 可写（编辑）的代码
	- `s`: 可分享的代码
	- `n`: 关闭行号

比如:

```
code="-"         // 忽略的代码块
code="+b"        // 错误且会被忽略的代码块（默认程序为 main）
code="+e"        // 错误但不可忽略的代码块（默认程序为 main）
code="+x"        // 可运行的代码块（默认程序为 main）
code="+xw"       // 可运行且可编辑的代码块（默认程序为 main）
code="main"      // 属于程序 main 的代码块
code="main+b"    // 属于程序 main 的错误的代码块
code="main+x"    // 属于程序 main 的可运行代码块
code="main+xw"   // 属于程序 main 的可运行且可编辑的代码块
code="other"     // 属于程序 other 的代码块
code="other+b"   // 属于程序 other 的错误的代码块
code="other+x"   // 属于程序 other 的可运行代码块
code="other+xw"  // 属于程序 other 的可运行且可编辑的代码块
```

* code.tags 用于指定它预定义和自定义标签，预定义标签包括：
	- lineOffset: lineno | map[lineno]offset，指定行号偏移，
		当类型为 map 时指定若干个行号偏移，比如
		`lineOffset=1` 表示起始行号偏移 1 即从 2 开始，
		`lineOffset={1:1;5:2}` 表示起始行号偏移 1 到第 5 行再偏移 2 行从 8 开始。
	- hightlight: lineno | [lineno]，指定一行或若干行高亮（采用默认样式）。
	- frontground: map[lineno]color，指定特定行的文字颜色，color 使用 `#RRGGBB` 的或预知样式名称。
	- background: map[lineno]color，指定特定行的背景颜色。

一个典型的代码块标注例子

```go {code="+x"}
func main() {
	fmt.Println("hello")
}
```

网站设计
--------

网站主打 go 学习社区。主要提供以下服务

* 最新咨询: 包括语言本身，相关应用
* 学习教程: 本站提供基础学习教程，以及外部教程链接
* 网友博文: 提供博文书写平台，以及博文分享，罗列热门博文
* 开源项目:

TODO
----

### posts

* 数据库基础
* 数据结构基础
* 算法基础
* 网络基础

### tools

* 时间戳转换
* checksum 计算
* 图片格式转换
* 视频格式转换
* 颜色表，颜色空间变换
