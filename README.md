# img-glsl-webui
GLSL on images via WebGL (LLM generated)

### What's this?
You combine an image and glsl shader within the webui, you get to export them as png/jpg or webm afterwards.

It features:
- 5 Shader save slots (left click to save/load, right click to clear or tap to save/load, hold to clear on mobile)
- experimental webm export
- png/jpg export
- middle click drag input adjustment (swipe input adjustment on mobile)
- responsive design
- single html file
- console logging
- image drag/drop, paste, url support
- bugs

### Why?
I wanted to use my shaders to export images larger than my monitor resolution (mainly used hyprshade with screenshots). I spent a tiny, tiny bit of hours with claude 3.7 low (shout out t3 chat for cheap service) and somehow got this. It works well enough for me (so far).

### Is this slop?
It does its job, maybe.

### How to run?
Download/copy the latest html file from the [revisions folder](https://github.com/PopCat19/img-glsl-webui/tree/main/revisions) (e.g. [glsl-webui-r2.html](https://github.com/PopCat19/img-glsl-webui/blob/main/revisions/glsl-webui-r2.html)) and open it with your browser. There's [GitHub Pages](https://popcat19.github.io/img-glsl-webui/index.html) too, if you don't want to deploy it yourself.

### No shaders?
You can also use [my glsl](https://github.com/PopCat19/img-glsl-webui/blob/main/cool-stuff.glsl) from this repo. (its indeed 96% LLM generated shader :3)
