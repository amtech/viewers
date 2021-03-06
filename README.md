viewers
=======

易度云查看的查看器

参看：http://viewer.everydo.com

查看器的功能：

- 支持多种查看器
- 设置查看器的大小
- 如果查看文件还未生成，自动重复请求
- 是否允许选择文字
- 是否允许打印
- 设置水印信息

可以简单的如下调用

    var viewer = EdoViewer.createViewer(identify, kwargs);
    viewer.load();

kwargs是一个展示参数，包括：

- width：宽度
- height：高度
- allow_print：是否允许打印
- allow_copy：是否允许复制
- waterprint_text: 水印文字
- waterprint_size: 水印字体大小
- waterprint_alpha: 水印透明度
- waterprint_color：水印颜色
- waterprint_x: x方向位置
- waterprint_y: y方向位置
- waterprint_rotation: 方向旋转(从 0 到 180 的值表示顺时针方向旋转；从 0 到 -180 的值表示逆时针方向旋转)
- loading_info: 文档正在加载的提示
- converting_info: 文档正在转换的提示
- timeout_info: 文档转换超时的提示

也可以单独调用查看器：

- 纯文本查看器

            render_text_viewer(url, identidy, kwargs)

- 图片查看器

            render_image_viewer(url, identidy, kwargs)

- html查看器

            render_html_viewer(url, identidy, kwargs)

- 压缩包查看器

            render_zip_viewer(url, identidy, kwargs)

- 音频查看器

            render_audio_viewer(url, identidy, kwargs)

- 视频查看器

            render_video_viewer(url, identidy, kwargs)

- 易度的pdf转换swfx查看器

            render_flash_viewer(url, identidy, kwargs)
