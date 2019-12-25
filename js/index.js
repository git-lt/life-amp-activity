import resourcesData from "./config/resources.js";
import scenesData from "./config/scene.js";
import spritesData from "./config/sprites.js";
import animationData from "./config/animation.js";
import { intervals, audiosMap } from "./config/audios.js";

class Main {
  app = null;
  scenes = [];
  timeline = null;
  sprites = {};
  tickerPhone = null;
  actTrumpet = null;
  scale = 0;
  cacheAudioIndex = [];
  init() {
    console.log("Main:init");
    const min = Math.min(window.__clientH, window.__clientW);
    this.scale = min / 750;
    // 加载资源
    this.initLoader();
    // 动画时间线
    this.timeline = this.initTimeline();
    this.cacheAudioIndex = [];
  }

  initApp() {
    const app = new PIXI.Application({
      width: window.__clientW,
      height: window.__clientH,
      backgroundColor: 0xd7a664,
      forceCanvas: true
    });
    document.body.appendChild(app.view);
    app.stage.scale.set(this.scale, this.scale);

    if (window.__clientW < window.__clientH) {
      app.stage.rotation = Math.PI / 2;
      app.stage.x = window.__clientW;
    }

    return app;
  }

  initLoader() {
    const loader = new PIXI.loaders.Loader();
    Object.keys(resourcesData).forEach(v => loader.add(v, resourcesData[v]));

    loader.on("progress", this.updateLoading);
    loader.once("complete", this.onLoaded);
    loader.load(); // 加载资源
  }

  updateLoading(target) {
    $("#percent").text(parseInt(target.progress) + "%");
  }

  onLoaded = () => {
    // 隐藏 Loading
    $("#loading").hide();
    // 播放背景音乐
    this.playBgm();
    // 初始化舞台 stage (canvas、webgl)
    this.app = this.initApp();
    // 初始化场景画布 scene
    this.scenes = this.initScenes();
    // 显示精灵图
    this.initSprites();
    this.initTextSprites();
    // 初始化 动画
    this.initAnimation();
    this.bindEvents();
  };

  playBgm() {
    const bgEl = document.getElementById("bg");
    bgEl.volume = 0.2;
    bgEl.play();
  }

  initScenes = () => {
    const scenes = scenesData.map(v => {
      let scene = new PIXI.Container({
        width: v.width,
        height: v.height,
        backgroundColor: 0xd7a664
      });
      scene.x = v.x;
      scene.y = v.y;

      return scene;
    });
    this.app.stage.addChild(...scenes);
    return scenes;
  };

  initSprites = () => {
    spritesData.forEach((v, i) => {
      // 找到相关 资源图
      Object.keys(v).forEach(t => {
        if (resourcesData[t]) {
          let sprite = PIXI.Sprite.fromImage(t);
          // 添加属性
          Object.keys(v[t]).forEach(k => {
            sprite[k] = v[t][k];
          });

          this.sprites[t] = sprite;
          this.scenes[i].addChild(sprite);
        }
      });
    });
  };

  initTouch = (vertical, direction) => {
    const max = Math.max(window.__clientH, window.__clientW);
    const appW = this.app.stage.width;
    const scrollDis = appW - 2 * max;

    new AlloyTouch({
      touch: "body", //反馈触摸的dom
      vertical: vertical,
      min: -scrollDis,
      maxSpeed: 1,
      max: 0, //不必需,滚动属性的最大值
      bindSelf: false,
      initialValue: 0,
      change: value => {
        let progress = -value / scrollDis;
        progress = progress < 0 ? 0 : progress > 1 ? 1 : progress;
        this.app.stage.position[direction] = value - max;
        this.timeline.seek(progress);
        // 播放音乐
        this.updateAudio(progress);
        // 抽奖规则显示
        if (progress >= 0.99) {
          document.getElementById("form-panel").style.display = "flex";
          document.getElementById("rule-link").style.display = "flex";
        } else {
          document.getElementById("form-panel").style.display = "none";
          document.getElementById("rule-link").style.display = "none";
        }
      }
    });
  };

  initTextSprites = () => {
    const style1 = new PIXI.TextStyle({
      fontFamily: "SourceHanSansSC-Normal",
      align: "center",
      fontSize: 30,
      lineHeight: 48,
      fill: ["#ffffff"],
      wordWrap: true,
      wordWrapWidth: 500
    });
    const style2 = new PIXI.TextStyle({
      fontFamily: "SourceHanSansSC-Normal",
      align: "center",
      fontSize: 43,
      lineHeight: 66,
      fill: ["#ffffff"], // gradient
      wordWrap: true,
      wordWrapWidth: 500
    });

    let text1 = new PIXI.Text(
      "风雨无阻的是归家之路\n陪伴相守才是最珍贵的礼物\n国寿安保基金愿与你一路同行\n用专业为爱投资\n用成就回报信任",
      style1
    );
    text1.x = 1040;
    text1.y = 60;

    let text2 = new PIXI.Text("动动手指参与活动，为家人赢取一份春节好礼吧", style2);
    text2.x = 800;
    text2.y = text1.height + text1.y;

    this.scenes[7].addChild(text1, text2);
  };

  initTimeline = () => {
    return new TimelineMax({ paused: true });
  };

  initAnimation = () => {
    Object.keys(animationData).forEach(k => {
      animationData[k].forEach(v => {
        const { duration, delay, from, to } = v;
        let sprite = this.sprites[k];
        let act = null;
        if (from && to) {
          act = TweenMax.fromTo(sprite, duration, from, to);
        } else if (from) {
          act = TweenMax.from(sprite, duration, from);
        } else if (to) {
          act = TweenMax.to(sprite, duration, to);
        }
        const tm = new TimelineMax({ delay });
        tm.add(act, 0);
        tm.play();
        this.timeline.add(tm, 0);
      });
    });

    // 特殊动画特殊处理
    this.sprites.phone.pivot.set(173, 164);
    let tickerPhone = new PIXI.ticker.Ticker();
    let count = 0;
    tickerPhone.stop();
    tickerPhone.add(delta => {
      count++;
      if (count == 11) count = 0;
      if (this.sprites.phone.rotation > 1 && count % 10 == 0) {
        this.sprites.phone.rotation -= 0.1 * delta;
      } else if (this.sprites.phone.rotation < 1 && count % 10 == 0) {
        this.sprites.phone.rotation += 0.1 * delta;
      }
    });
    tickerPhone.start();

    // 喇叭播音
    const actTrumpet = new TweenMax(this.sprites.trumpet, 0.5, {
      width: 210 * 0.85,
      height: 179 * 0.85,
      repeat: -1,
      yoyo: true,
      ease: Power0.easeNone
    });

    // 手机振动
    this.tickerPhone = tickerPhone;
    this.actTrumpet = actTrumpet;
  };

  bindEvents = () => {
    this.sprites.btn.interactive = true;
    this.sprites.btn.buttonMode = true;
    this.sprites.btn.on("pointerdown", this.onStart);
  };

  onStart = () => {
    if (window.__clientW < window.__clientH) {
      // 竖屏
      let tm = new TweenMax.to(this.app.stage.position, 1.5, { y: -this.scenes[0].width * this.scale });
      tm.play();
      this.initTouch(true, "y");
    } else {
      // 横屏
      let tm = new TweenMax.to(this.app.stage.position, 1.5, { x: -this.scenes[0].width * this.scale });
      tm.play();
      this.initTouch(false, "x");
    }

    // 窗子动画
    let tm1 = new TweenMax.to(this.sprites.windows.scale, 3, { delay: 1.5, x: 2, y: 2, ease: Power0.easeNone });
    let tm2 = new TweenMax.to(this.sprites.windows, 3, { delay: 2, alpha: 0 });
    tm1.play();
    tm2.play();

    // 对话
    let tm_talk_1 = new TweenMax.from(this.sprites.talk_1, 1, { delay: 2, width: 0, height: 0, ease: Power0.easeNone });
    let tm_talk_2 = new TweenMax.from(this.sprites.talk_2, 1, { delay: 4, width: 0, height: 0, ease: Power0.easeNone });
    tm_talk_1.play();
    tm_talk_2.play();

    setTimeout(() => {
      this.playAudio([{ audio: "talk_1", duration: 1500 }, { audio: "talk_2" }]);
    }, 2000);
  };

  playAudio = audioList => {
    audioList
      .map(v => () =>
        new Promise(resolve => {
          console.log(v.audio);
          $(`#${v.audio}`)[0].play();
          setTimeout(resolve, v.duration || 0);
        })
      )
      .reduce((p, n) => p.then(n), Promise.resolve());
  };

  getAudios = (progress, callback) => {
    for (let i = 0; i < intervals.length; i++) {
      if (progress >= intervals[i][0] && progress <= intervals[i][1]) {
        return callback(i);
      }
    }
  };

  updateAudio(progress) {
    // console.log(progress);
    // return;
    this.getAudios(progress, i => {
      // console.log(i, intervals[i], progress);
      // return;
      // 防止 重复调用播放
      if (!this.cacheAudioIndex.length || !this.cacheAudioIndex.includes(i)) {
        this.cacheAudioIndex.push(i);
        if (i === 8) this.cacheAudioIndex = [];
        const audios = audiosMap[i];
        console.log(i, intervals[i], progress);
        this.playAudio(audios);
        if (i === 0) {
          setTimeout(() => this.tickerPhone.stop(), 2000);
          return;
        }

        if (i === 8) {
          this.actTrumpet.play();
          setTimeout(() => {
            this.actTrumpet.pause();
          }, 8000);
        }
      }
    });
  }
}

export default new Main().init();
