---
title: "获取 B 站加权评分的番剧排行榜"
date: 2022-02-17
keywords: ["动漫", "番剧", "排行榜"]
abstract: "B 站上番剧排行榜都是按照单一指标（如追番数，观看数，用户评分）进行的，这无法较好的反映番剧的评分，这里通过 http 接口获取番剧的信息然后加权评分得出排行榜。"
---

```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"sort"
	"strconv"
	"strings"
)

const urlTemplate = "https://api.bilibili.com/pgc/season/index/result?season_version=-1&spoken_language_type=-1&area=-1&is_finish=-1&copyright=-1&season_status=-1&season_month=-1&year=-1&style_id=-1&order=%d&st=1&sort=0&page=1&season_type=1&pagesize=%d&type=1"

const (
	byScore     = 4
	byFavorites = 3
	byPlay      = 2
)

type Media struct {
	Id        int
	Title     string
	Score     float64
	Favorites float64
	Play      float64
	Season    int

	Weight float64
}

func (m *Media) calculateWeightedScore(maxFavorites, maxPlay float64) {
	const scoreWeight = 0.8
	const favoritesWeight = 0.1
	const playWeight = 0.1
	m.Weight = scoreWeight*m.Score +
		favoritesWeight*10*normalize(m.Favorites/maxFavorites) +
		playWeight*10*normalize(m.Play/maxPlay)
}

func normalize(x float64) float64 {
	return math.Sqrt(x)
}

func log10(x int) int {
	var n int
	for x >= 10 {
		x /= 10
		n++
	}
	return n
}

func prettyNumber(x int) string {
	var format string
	var value interface{}
	var pow = log10(x)
	if pow < 4 {
		return strconv.Itoa(x)
	} else if pow < 8 {
		if pow == 7 {
			format = "%d万"
			value = x / 1e4
		} else {
			format = fmt.Sprintf("%%.%df万", 7-pow)
			value = float64(x) / 1e4
		}
	} else if pow < 10 {
		format = fmt.Sprintf("%%.%df亿", 10-pow)
		value = float64(x) / 1e8
	} else {
		format = "%d亿"
		value = x / 1e8
	}
	return fmt.Sprintf(format, value)
}

func isDigit(b byte) bool {
	return b >= '0' && b <= '9'
}

func trim(s string) string {
	const n = 64
	var v []rune
	for i, r := range s {
		if i >= n {
			v = append(v, '.', '.', '.')
			break
		}
		v = append(v, r)
	}
	return string(v)
}

func parseFloatPrefix(s string) float64 {
	var n = len(s)
	for i := 0; i < n; i++ {
		if !isDigit(s[i]) && s[i] != '.' {
			n = i
			break
		}
	}
	if n == 0 {
		return 0
	}
	var unit = float64(1)
	if strings.HasPrefix(s[n:], "十亿") {
		unit = 1e9
	} else if strings.HasPrefix(s[n:], "亿") {
		unit = 1e8
	} else if strings.HasPrefix(s[n:], "千万") {
		unit = 1e7
	} else if strings.HasPrefix(s[n:], "百万") {
		unit = 1e6
	} else if strings.HasPrefix(s[n:], "十万") {
		unit = 1e5
	} else if strings.HasPrefix(s[n:], "万") {
		unit = 1e4
	}
	v, _ := strconv.ParseFloat(s[:n], 64)
	return v * unit
}

func query(medias []Media, indices map[int]int, by int, size int) []Media {
	var result struct {
		Code int `json:"code"`
		Data struct {
			List []struct {
				MediaId   int    `json:"media_id"`
				Title     string `json:"title"`
				OrderType string `json:"order_type"`
				Order     string `json:"order"`
				Season    int    `json:"season_type"`
			} `json:"list"`
		} `json:"data"`
	}
	var url = fmt.Sprintf(urlTemplate, by, size)
	var resp, err = http.Get(url)
	if err != nil {
		log.Fatalf("get by %d error: %v", by, err)
	}
	defer resp.Body.Close()
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Fatalf("unmarshal from json error: %v", err)
	}
	for i := range result.Data.List {
		index, ok := indices[result.Data.List[i].MediaId]
		if !ok {
			index = len(medias)
			var m = Media{
				Id:     result.Data.List[i].MediaId,
				Title:  result.Data.List[i].Title,
				Season: result.Data.List[i].Season,
			}
			indices[m.Id] = index
			medias = append(medias, m)
		}
		order := parseFloatPrefix(result.Data.List[i].Order)
		switch by {
		case byScore:
			medias[index].Score = order
		case byFavorites:
			medias[index].Favorites = order
		case byPlay:
			medias[index].Play = order
		default:
			panic("unknown orderby")
		}
	}

	return medias
}

func main() {
	var medias []Media
	var indices = make(map[int]int)
	const size = 4000
	medias = query(medias, indices, byScore, size)
	medias = query(medias, indices, byFavorites, size)
	medias = query(medias, indices, byPlay, size)
	var maxFavorites, maxPlay float64
	for i, m := range medias {
		if i == 0 || m.Favorites > maxFavorites {
			maxFavorites = m.Favorites
		}
		if i == 0 || m.Play > maxPlay {
			maxPlay = m.Play
		}
	}
	for i := range medias {
		medias[i].calculateWeightedScore(maxFavorites, maxPlay)
	}
	sort.Slice(medias, func(i, j int) bool {
		return medias[i].Weight > medias[j].Weight
	})

	var table bytes.Buffer
	var maxCount = 200
	table.WriteString(`
|排名|番名|用户评分|追番数|播放次数|权重评分|
|----|----|--------|------|--------|--------|`)
	for i, m := range medias {
		if i >= maxCount {
			break
		}
		fmt.Fprintf(&table, "\n|%d|%s|%.01f|%s|%s|%.01f|", i+1, trim(m.Title), m.Score, prettyNumber(int(m.Favorites)), prettyNumber(int(m.Play)), m.Weight)
	}
	fmt.Println(table.String())
}
```

根据上面的代码获取 Top-200 的番剧如下：

|排名|番名|用户评分|追番数|播放次数|权重评分|
|----|----|--------|------|--------|--------|
|1|鬼灭之刃|9.7|1144万|8.10亿|9.7|
|2|咒术回战|9.7|1069万|6.70亿|9.6|
|3|鬼灭之刃 无限列车篇|9.8|1276万|1.20亿|9.2|
|4|名侦探柯南|9.8|393.9万|5.10亿|9.2|
|5|JOJO的奇妙冒险 黄金之风|9.8|468.6万|4.40亿|9.2|
|6|小林家的龙女仆|9.7|774.8万|3.20亿|9.2|
|7|辉夜大小姐想让我告白～天才们的恋爱头脑战～|9.8|732.6万|2.50亿|9.2|
|8|辉夜大小姐想让我告白？～天才们的恋爱头脑战～|9.8|745.5万|2.00亿|9.1|
|9|青春猪头少年不会梦到兔女郎学姐|9.8|732.8万|2.00亿|9.1|
|10|Re：从零开始的异世界生活 第二季 后半|9.9|844.2万|8797万|9.1|
|11|OVERLORD|9.6|600.2万|3.90亿|9.1|
|12|堀与宫村|9.8|653.0万|2.00亿|9.1|
|13|某科学的超电磁炮T|9.8|620.1万|2.00亿|9.0|
|14|紫罗兰永恒花园|9.8|741.2万|1.50亿|9.0|
|15|JOJO的奇妙冒险 石之海|9.9|733.6万|1.00亿|9.0|
|16|工作细胞|9.6|796.3万|2.20亿|9.0|
|17|OVERLORD Ⅱ|9.6|527.0万|3.60亿|9.0|
|18|关于我转生变成史莱姆这档事|9.4|722.7万|4.10亿|9.0|
|19|冰菓|9.8|673.3万|1.20亿|9.0|
|20|Re：从零开始的异世界生活 第二季 前半|9.7|769.7万|1.30亿|8.9|
|21|JOJO的奇妙冒险|9.8|530.0万|1.60亿|8.9|
|22|四月是你的谎言|9.8|518.6万|1.50亿|8.9|
|23|关于我转生变成史莱姆这档事 转生史莱姆日记|9.7|829.2万|9037万|8.9|
|24|碧蓝之海|9.9|417.8万|1.30亿|8.9|
|25|猫和老鼠 旧版|9.9|261.2万|2.10亿|8.9|
|26|名侦探柯南（中配）|9.8|112.1万|4.30亿|8.9|
|27|工作细胞 第二季|9.7|836.2万|6981万|8.9|
|28|OVERLORD Ⅲ|9.4|539.1万|3.80亿|8.9|
|29|犬夜叉|9.9|216.6万|2.20亿|8.9|
|30|徒然喜欢你|9.7|549.9万|1.50亿|8.8|
|31|这个勇者明明超强却过分慎重|9.7|503.2万|1.70亿|8.8|
|32|紫罗兰永恒花园 剧场版 |9.9|787.0万|1503万|8.8|
|33|银魂|9.9|242.2万|1.90亿|8.8|
|34|异度侵入 ID:INVADED|9.8|464.0万|1.20亿|8.8|
|35|JOJO的奇妙冒险 星尘远征军|9.8|430.1万|1.30亿|8.8|
|36|某科学的超电磁炮|9.7|519.9万|1.40亿|8.8|
|37|紫罗兰永恒花园外传：永远与自动手记人偶|9.9|594.8万|3439万|8.8|
|38|JOJO的奇妙冒险 不灭钻石|9.8|288.5万|1.90亿|8.8|
|39|JOJO的奇妙冒险 星尘远征军 埃及篇|9.8|410.1万|1.20亿|8.8|
|40|我的青春恋爱物语果然有问题。续|9.8|320.6万|1.40亿|8.8|
|41|小林家的龙女仆 第二季|9.5|847.9万|9083万|8.8|
|42|NO GAME NO LIFE 游戏人生|9.8|447.4万|8075万|8.7|
|43|路人超能100 II(灵能百分百 第二季)|9.9|279.3万|9861万|8.7|
|44|岸边露伴 一动也不动|9.9|510.3万|2310万|8.7|
|45|夏目友人帐 唤石者与怪异的访客|9.9|566.7万|1260万|8.7|
|46|路人超能100(灵能百分百)|9.8|324.2万|1.00亿|8.7|
|47|刀剑神域|9.7|337.7万|1.40亿|8.7|
|48|日常|9.9|344.2万|5086万|8.7|
|49|埃罗芒阿老师|9.3|700.0万|2.10亿|8.7|
|50|致不灭的你|9.6|468.6万|1.30亿|8.7|
|51|卫宫家今天的饭|9.8|351.0万|8247万|8.7|
|52|Ｄｒ．ＳＴＯＮＥ 石纪元|9.7|328.1万|1.40亿|8.7|
|53|你的名字。|9.9|270.2万|7151万|8.7|
|54|天使降临到我身边|9.8|362.2万|7473万|8.7|
|55|Re：从零开始的异世界生活 新编集版|9.6|620.1万|7152万|8.7|
|56|中二病也要谈恋爱！|9.8|452.8万|4387万|8.7|
|57|我的青春恋爱物语果然有问题。|9.7|430.8万|8635万|8.7|
|58|擅长捉弄的高木同学 第二季|9.9|273.4万|6381万|8.7|
|59|黑色四叶草|9.5|264.1万|3.00亿|8.7|
|60|约定的梦幻岛|9.8|343.7万|7495万|8.7|
|61|CLANNAD|9.9|334.3万|4268万|8.7|
|62|齐木楠雄的灾难|9.7|297.4万|1.40亿|8.7|
|63|齐木楠雄的灾难 第二季|9.8|238.6万|1.20亿|8.7|
|64|Fate/stay night [Unlimited Blade Works] 第一季|9.5|437.1万|1.80亿|8.7|
|65|月色真美|9.8|355.1万|6743万|8.7|
|66|命运-冠位指定 绝对魔兽战线 巴比伦尼亚|9.5|476.5万|1.60亿|8.7|
|67|异世界迷宫黑心企业|9.8|317.7万|8034万|8.7|
|68|迪迦奥特曼（中配）|9.9|167.0万|1.00亿|8.6|
|69|青春猪头少年不会梦到怀梦美少女|9.8|494.2万|2351万|8.6|
|70|总之就是非常可爱|9.5|485.7万|1.40亿|8.6|
|71|五等分的新娘∬|9.7|452.4万|6202万|8.6|
|72|游戏人生 零|9.9|352.0万|2585万|8.6|
|73|Fate/Zero 第一季|9.6|397.0万|1.20亿|8.6|
|74|家庭教师HITMAN REBORN!|9.9|164.6万|9547万|8.6|
|75|关于我转生变成史莱姆这档事 第二季|8.9|889.6万|3.60亿|8.6|
|76|在下坂本，有何贵干？|9.3|570.1万|2.10亿|8.6|
|77|女高中生的虚度日常|9.8|309.1万|6535万|8.6|
|78|月刊少女野崎君|9.8|376.1万|4404万|8.6|
|79|Angels of Death|9.5|504.1万|1.20亿|8.6|
|80|工作细胞BLACK|9.8|292.5万|7018万|8.6|
|81|魔卡少女樱 CLEAR CARD篇|9.8|293.9万|6669万|8.6|
|82|文豪野犬 第三季|9.8|289.3万|6392万|8.6|
|83|动物狂想曲 / BEASTARS|9.7|341.7万|8142万|8.6|
|84|齐木楠雄的灾难（日播&精选版）|9.6|184.4万|2.30亿|8.6|
|85|入间同学入魔了 第二季|9.7|335.2万|8266万|8.6|
|86|擅长捉弄的高木同学 第三季|9.9|314.5万|2352万|8.6|
|87|男子高中生的日常|9.8|291.5万|5665万|8.6|
|88|多罗罗|9.4|445.3万|1.80亿|8.6|
|89|关于前辈很烦人的事|9.8|269.7万|6335万|8.6|
|90|Ｄｒ．ＳＴＯＮＥ 石纪元  (第二季)|9.7|368.7万|6259万|8.6|
|91|魔女之旅|9.7|332.1万|7451万|8.6|
|92|夏目友人帐|9.8|312.3万|4605万|8.6|
|93|齐木楠雄的灾难 始动篇|9.8|370.9万|2896万|8.6|
|94|轻音少女 第一季|9.9|233.9万|3771万|8.6|
|95|Charlotte|9.4|476.4万|1.50亿|8.6|
|96|可塑性记忆|9.7|327.6万|6976万|8.6|
|97|会长是女仆大人！|9.8|249.3万|6200万|8.6|
|98|宝石之国|9.7|325.3万|6946万|8.6|
|99|樱花庄的宠物女孩|9.7|371.6万|5200万|8.6|
|100|装甲重拳/MEGALOBOX 第二季|9.9|240.6万|3179万|8.6|
|101|干物妹！小埋R|9.4|479.2万|1.40亿|8.5|
|102|命运-冠位嘉年华|9.8|481.0万|687.5万|8.5|
|103|百变小樱|9.8|185.7万|8123万|8.5|
|104|某科学的超电磁炮S|9.7|261.4万|8512万|8.5|
|105|路人女主的养成方法 Fine|9.8|412.3万|1305万|8.5|
|106|龙与虎|9.7|320.7万|5903万|8.5|
|107|银魂 第二季|9.9|157.1万|5227万|8.5|
|108|强风吹拂|9.9|174.4万|4453万|8.5|
|109|装甲重拳/MEGALOBOX|9.8|215.6万|5907万|8.5|
|110|蜡笔小新 第二季（中文）|9.8|59.00万|1.70亿|8.5|
|111|玉子市场|9.8|265.4万|3799万|8.5|
|112|Re：从零开始的异世界生活 Memory Snow(雪之回忆)|9.7|491.7万|1368万|8.5|
|113|火影忍者 疾风传|9.6|190.4万|1.60亿|8.5|
|114|干物妹！小埋|9.3|477.9万|1.70亿|8.5|
|115|珈百璃的堕落|9.6|321.2万|8583万|8.5|
|116|Fate/stay night [Unlimited Blade Works] 第二季|9.5|290.1万|1.50亿|8.5|
|117|路人女主的养成方法|9.4|415.8万|1.40亿|8.5|
|118|食戟之灵|9.5|253.4万|1.70亿|8.5|
|119|在魔王城说晚安|9.7|276.6万|6242万|8.5|
|120|这个美术社大有问题！|9.8|220.3万|4935万|8.5|
|121|蜡笔小新 第一季（中文）|9.8|93.80万|1.20亿|8.5|
|122|命运之夜——天之杯II ：迷失之蝶|9.7|416.3万|2184万|8.5|
|123|夏目友人帐 第六季|9.8|215.4万|4799万|8.5|
|124|请问您今天要来点兔子吗？BLOOM|9.9|249.0万|1399万|8.5|
|125|我们仍未知道那天所看见的花的名字。|9.6|412.6万|4805万|8.5|
|126|Fate/Zero 第二季|9.6|230.9万|1.20亿|8.5|
|127|转生成为了只有乙女游戏破灭Flag的邪恶大小姐 第...|9.6|375.0万|5806万|8.5|
|128|极主夫道|9.7|287.1万|5259万|8.5|
|129|理科生坠入情网，故尝试证明。|9.7|292.1万|5084万|8.5|
|130|超能力女儿|9.6|285.4万|8898万|8.5|
|131|戒律的复活|9.7|197.7万|8818万|8.5|
|132|玉子爱情故事|9.9|213.8万|1878万|8.5|
|133|ReLIFE|9.9|192.2万|2371万|8.5|
|134|少女终末旅行|9.8|233.6万|3595万|8.5|
|135|银魂 第三季|9.9|154.4万|3512万|8.5|
|136|打工吧！魔王大人|9.6|249.9万|1.00亿|8.5|
|137|CAROLE & TUESDAY|9.7|232.8万|6599万|8.5|
|138|此花亭奇谭|9.8|228.6万|3462万|8.5|
|139|路人女主的养成方法 ♭|9.7|360.7万|2555万|8.5|
|140|阿宅的恋爱真难|9.6|313.2万|6969万|8.5|
|141|欢迎光临樱兰高校|9.9|133.1万|4121万|8.5|
|142|夏目友人帐 第五季|9.7|260.5万|5328万|8.5|
|143|入间同学入魔了|9.5|277.7万|1.30亿|8.5|
|144|文豪野犬 汪！|9.8|279.7万|2031万|8.5|
|145|鬼灭之刃 中配版|9.1|769.8万|1.30亿|8.5|
|146|转生成为了只有乙女游戏破灭Flag的邪恶大小姐|9.5|330.6万|9674万|8.5|
|147|妖精森林的小不点|9.9|155.0万|2772万|8.5|
|148|魔法少女小圆|9.8|204.5万|3659万|8.5|
|149|EVA 新世纪福音战士|9.7|208.4万|6674万|8.5|
|150|甘城光辉游乐园|9.7|273.2万|4128万|8.4|
|151|元气少女缘结神◎|9.7|268.4万|4207万|8.4|
|152|游戏王 怪兽之决斗|9.8|83.00万|1.00亿|8.4|
|153|CLANNAD ～AFTER STORY～|9.9|145.9万|2816万|8.4|
|154|悠哉日常大王 第三季|9.9|171.1万|2006万|8.4|
|155|君主·埃尔梅罗二世事件簿 魔眼收集列车 Grace not...|9.7|236.8万|5078万|8.4|
|156|奇蛋物语 / WONDER EGG PRIORITY|9.7|246.6万|4492万|8.4|
|157|幻界战线 & BEYOND|9.8|177.9万|3974万|8.4|
|158|约战狂三外传|9.6|450.3万|2064万|8.4|
|159|冰海战记|9.8|162.7万|4505万|8.4|
|160|俺物语！！|9.9|130.3万|2750万|8.4|
|161|公主连结Re:Dive|9.5|307.9万|8953万|8.4|
|162|街角魔族|9.8|176.6万|3623万|8.4|
|163|轻音少女 第二季|9.9|109.2万|3603万|8.4|
|164|死神少爷与黑女仆|9.7|236.0万|4297万|8.4|
|165|路人超能100 第一次灵能咨询所员工旅游～舒缓心...|9.8|318.6万|478.4万|8.4|
|166|黑执事|9.8|181.9万|3182万|8.4|
|167|佐贺偶像是传奇 卷土重来|9.9|134.5万|2326万|8.4|
|168|国王排名|8.6|936.6万|3.70亿|8.4|
|169|赛马娘 第二季|9.9|131.6万|2230万|8.4|
|170|迪迦奥特曼|9.9|106.4万|3115万|8.4|
|171|因为太怕痛就全点防御力了|9.0|595.4万|2.20亿|8.4|
|172|One Room 第三季|9.8|204.4万|2077万|8.4|
|173|SSSS.电光机王|9.8|164.6万|3276万|8.4|
|174|终将成为你|9.8|184.0万|2611万|8.4|
|175|幻界战线|9.6|240.9万|6496万|8.4|
|176|邪神与厨二病少女 第二季|9.8|170.9万|2887万|8.4|
|177|排球少年！！|9.9|94.40万|3251万|8.4|
|178|天气之子|9.6|314.7万|3586万|8.4|
|179|邻家索菲|9.8|161.8万|2888万|8.4|
|180|薇薇 -萤石眼之歌-|9.8|160.4万|2927万|8.4|
|181|境界的彼方|9.5|383.4万|4510万|8.4|
|182|吹响吧！上低音号|9.8|147.3万|3353万|8.4|
|183|小木乃伊到我家|9.6|244.5万|5585万|8.4|
|184|言叶之庭|9.7|255.8万|2408万|8.4|
|185|打了300年的史莱姆，不知不觉就练到了满级|9.5|274.4万|8022万|8.4|
|186|命运-冠位指定 -月光／失落之室-|9.6|486.0万|461.5万|8.4|
|187|世界顶尖的暗杀者,转生为异世界贵族|9.2|470.0万|1.30亿|8.4|
|188|我们的重制人生|9.6|230.7万|5447万|8.4|
|189|泽塔奥特曼|9.8|96.40万|4880万|8.4|
|190|野良神|9.5|320.8万|5424万|8.4|
|191|关于完全听不懂老公在说什么的事 第一季|9.7|127.2万|6526万|8.4|
|192|灰与幻想的格林姆迦尔|9.8|163.4万|2111万|8.4|
|193|流汗吧！健身少女|9.7|170.1万|4216万|8.4|
|194|比宇宙更远的地方|9.8|152.8万|2231万|8.4|
|195|Re：从零开始的异世界生活 冰结之绊|9.5|491.2万|1387万|8.4|
|196|虫师|9.9|118.2万|1299万|8.4|
|197|斩服少女|9.8|162.4万|1878万|8.3|
|198|野良神 ARAGOTO|9.4|251.1万|1.20亿|8.3|
|199|Angel Beats!|9.7|234.5万|2055万|8.3|
|200|×××HOLiC|9.8|156.7万|1993万|8.3|
