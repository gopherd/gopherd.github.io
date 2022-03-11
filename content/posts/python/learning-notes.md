---
title: "Python 学习笔记"
date: 2022-03-07
abstract: "记录 Python 学习过程中不同于一般语言的特性。"
keywords: ["python"]
---

### 主要教程

* <a href="https://docs.python.org/zh-cn/3/tutorial/index.html" target="_blank">Python 教程</a>

#### 切片

* 对列表的索引支持负数，但不可以越界，而切片参数则可以为负数，也可以越界。

```py {code="$+wx"}
squares = [1, 4, 9, 16, 25]
print("squares:", squares)

print(squares[0])
print(squares[-1])

#bad: 5 out of range, try uncomment it and run
#print(squares[5])

print(squares[0:5])
print(squares[0:-1])
```

#### 循环

* for-else 语法的 else 分支在 for 循环正常结束时（即没有 break）触发

```py {code="$+wx"}
for i in range(10):
	if i == 5:
		print("break for")
		break
else:
	print("for-else brach executed")
```

* pass 语句: 语法上需要一个语句，但程序不实际执行任何动作时，可以使用该语句。

```py
def funA():
	pass
```

* match 语句: 与其他语言的 switch 相似，但可以在 case 字句中使用 `|` 符号匹配多个，使用 `_` 代表 default 分支，case 分支还可以在后面加 `if` 条件语句。

```py
match status:
	case 401 | 403 | 404:
    return "Not allowed"
```

```py
# point is an (x, y) tuple
match point:
    case (0, 0):
        print("Origin")
    case (0, y):
        print(f"Y={y}")
    case (x, 0):
        print(f"X={x}")
    case (x, y) if x == y:
        print(f"X=Y={x}")
    case (x, y):
        print(f"X={x}, Y={y}")
    case _:
        raise ValueError("Not a point")
```

#### 函数

* 在 python 的函数参数中存在位置参数，关键值参数，元组参数，字典参数。
* 参数调用方式又存在 3 种约束：仅按位置，按位置或关键字，仅按关键字。
* 关键值参数必须在位置参数之后，关键值参数之间的顺序无关紧要。
* lambda 关键字用于创建匿名函数，匿名函数只能是单个表达式。
