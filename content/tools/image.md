---
title: 图像转换工具
date: 2022-03-11
---

## Base64 图片

<div class="form-group">
<textarea class="form-control" id="tool-base64-image-editor" placeholder="data:image/png;base64,..." rows="10">
</textarea>
<br/>
<button id="tool-base64-image-button" type="button" class="btn btn-primary form-control">转 换</button>
<div id="tool-base64-image-result">
</div>
</div>

<script>
$(function() {
	var editor = document.getElementById("tool-base64-image-editor");
	var result = document.getElementById("tool-base64-image-result");
	var button = document.getElementById("tool-base64-image-button");
	button.addEventListener('click', function() {
		result.innerHTML = '';
		try {
			var img = document.createElement('img');
			var value = editor.value.trim();
			if (!value) {
				alert("请输入图片的 base64 数据");
				return;
			}
			if (value.indexOf("data:") !== 0) {
				value = "data:image/png;base64," + value;
			}
			img.src = value;
			result.appendChild(img);
		} catch (e) {
			alert("格式错误");
			console.error(e);
		}
	});
});
</script>
