//创建舞台，默认背景色是黑色的
// Laya.init(600, 300); 
// var txt = new Laya.Text(); 
// //设置文本内容
// txt.text = "Hello Layabox";  
// //设置文本颜色为白色，默认颜色为黑色
// txt.color = "#FF0000";  
// //设置文本字体大小，单位是像素
// txt.fontSize    = 66;  
// //设置字体描边
// txt.stroke = 5;//描边为5像素
// txt.strokeColor = "#FFFFFF";  
// //设置为粗体
// txt.bold = true;  
// //设置文本的显示起点位置X,Y
// txt.pos(60,100);  
// //设置舞台背景色
// Laya.stage.bgColor  = '#23238E';  
// //将文本内容添加到舞台 
// Laya.stage.addChild(txt);


class LayaSample {
    constructor() {
        //初始化引擎
        Laya.init(1136,640);
        var txt:Laya.Text = new Laya.Text();
        //设置文本内容
        txt.text = "hello_world";
        //设置文本颜色
        txt.color = "#000000";
         //设置文本字体
        txt.font = "Ya Hei";
        //设置字体大小
        txt.fontSize = 32;
        //设置文本取背景
        txt.bgColor = "#c30c30";
        //设置文本框的颜色
        txt.borderColor = "#23cfcf";
        txt
        //设置粗体、斜体
        txt.bold = true;
        //设置斜体
        txt.italic = true;
        Laya.stage.addChild(txt);
    }
}
new LayaSample();


// module laya {
// 	import Sprite = Laya.Sprite;
// 	import Stage = Laya.Stage;
// 	import Texture = Laya.Texture;
// 	import Browser = Laya.Browser;
// 	import Handler = Laya.Handler;
// 	import WebGL = Laya.WebGL;

// 	export class Sprite_DisplayImage {
// 		constructor() {
// 			// 不支持WebGL时自动切换至Canvas
// 			Laya.init(Browser.clientWidth, Browser.clientHeight, WebGL);

// 			Laya.stage.alignV = Stage.ALIGN_MIDDLE;
// 			Laya.stage.alignH = Stage.ALIGN_CENTER;

// 			Laya.stage.scaleMode = "showall";
// 			Laya.stage.bgColor = "#232628";

// 			this.showLayaBox();
// 		}

// 		private showLayaBox(): void {
// 			// 方法1：使用loadImage
// 			var ape: Sprite = new Sprite();
// 			Laya.stage.addChild(ape);
// 			ape.loadImage("img/layabox.png");

// 			// 方法2：使用drawTexture
// 			Laya.loader.load("img/layabox1.png", Handler.create(this, function(): void {
// 				var t: Texture = Laya.loader.getRes("img/layabox1.png");
// 				var ape: Sprite = new Sprite();
// 				ape.graphics.drawTexture(t, 0, 0);
// 				Laya.stage.addChild(ape);
// 				ape.pos(250, 0);
// 			}));
// 		}
// 	}
// }
// new laya.Sprite_DisplayImage();


// module laya {
//     import Sprite = Laya.Sprite;
//     import Stage = Laya.Stage;
//     import Event = Laya.Event;
//     import Browser = Laya.Browser;
//     import WebGL = Laya.WebGL;

//     export class Sprite_Container {
//         // 该容器用于装载4张猩猩图片
//         private apesCtn: Sprite;

//         constructor() {
//             // 不支持WebGL时自动切换至Canvas
//             Laya.init(Browser.clientWidth, Browser.clientHeight, WebGL);

//             Laya.stage.alignV = Stage.ALIGN_MIDDLE;
//             Laya.stage.alignH = Stage.ALIGN_CENTER;

//             Laya.stage.scaleMode = "showall"; //設定畫布的縮放模式，showall為縮的最小，全部看的到
//             Laya.stage.bgColor = "#00FFEE";

//             this.createApes();
//         }

//         private createApes(): void {
//             // 每只猩猩距离中心点100像素
//             var layoutRadius: number = 100;
//             var radianUnit: number = Math.PI / 2; //3.14...圓的周長除以自身的直徑

//             this.apesCtn = new Sprite();
//             Laya.stage.addChild(this.apesCtn);

//             // 添加4张猩猩图片
//             for (var i: number = 0; i < 4; i++) {
//                 var ape: Sprite = new Sprite();
//                 ape.loadImage("img/layabox" + i + ".png");

//                 // ape.pivot(0 , 0);
//                 // ape.pivot(550 , 720);
//                 //我看不懂上面的pivot在講三小

//                 // 以圆周排列猩猩
//                 ape.pos(
//                     Math.cos(radianUnit * i) * layoutRadius,
//                     Math.sin(radianUnit * i) * layoutRadius);

//                 this.apesCtn.addChild(ape);
//             }

//             this.apesCtn.pos(Laya.stage.width / 2, Laya.stage.height / 2);

//             Laya.timer.frameLoop(1, this, this.animate); //每X偵執行一次後面的東西，X為第一個參數
//         }

//         private animate(e: Event): void {
//             this.apesCtn.rotation += 1;
//         }
//     }
// }
// new laya.Sprite_Container();


// module laya {
//     import Sprite = Laya.Sprite;
//     import Stage = Laya.Stage;
//     import Event = Laya.Event;
//     import Browser = Laya.Browser;
//     import WebGL = Laya.WebGL;

//     export class Sprite_RoateAndScale {
//         private ape: Sprite;
//         private scaleDelta: number = 0.01;

//         constructor() {
//             // 不支持WebGL时自动切换至Canvas
//             Laya.init(Browser.clientWidth, Browser.clientHeight, WebGL);

//             Laya.stage.alignV = Stage.ALIGN_MIDDLE;
//             Laya.stage.alignH = Stage.ALIGN_CENTER;

//             Laya.stage.scaleMode = "showall";
//             Laya.stage.bgColor = "#232628";

//             this.createApe();
//         }

//         private createApe(): void {
//             this.ape = new Sprite();

//             this.ape.loadImage("img/layabox0.png");
//             Laya.stage.addChild(this.ape);
//             this.ape.pivot(100, 100);
//             this.ape.x = Laya.stage.width / 4;
//             this.ape.y = Laya.stage.height / 2;

//             Laya.timer.frameLoop(1, this, this.animate);
//         }

//         private animate(e: Event): void {
//             this.ape.rotation += 2;

//             //心跳缩放
//             this.scaleDelta += 0.02;
//             var scaleValue: number = Math.sin(this.scaleDelta); //typescript的Math.sin吃進去的是『弧度』而非『角度』
//             this.ape.scale(scaleValue, scaleValue);
//         }
//     }
// } 
// new laya.Sprite_RoateAndScale();


module laya {
    import Sprite = Laya.Sprite;
    import Stage = Laya.Stage;
    import Browser = Laya.Browser;
    import WebGL = Laya.WebGL;

    export class Sprite_DrawPath {
        constructor() {
            // 不支持WebGL时自动切换至Canvas
            Laya.init(Browser.clientWidth, Browser.clientHeight, WebGL);

            Laya.stage.alignV = Stage.ALIGN_MIDDLE;
            Laya.stage.alignH = Stage.ALIGN_CENTER;

            Laya.stage.scaleMode = "showall";
            Laya.stage.bgColor = "#232628";

            this.drawPentagram();
        }

        private drawPentagram(): void {
            var canvas: Sprite = new Sprite();
            Laya.stage.addChild(canvas);

            var path: Array<number> = []; //push為typescript的原生函式，給array使用，push裡頭帶兩個參數表示一次塞兩個元素進去
            // path.push(0, -130);
            // path.push(33, -33);
            // path.push(137, -30);
            // path.push(55, 32);
            // path.push(85, 130);
            // path.push(0, 73);
            // path.push(-85, 130);
            // path.push(-55, 32);
            // path.push(-137, -30);
            // path.push(-33, -33);
            // path.push(0, -130,33, -33,137, -30,55, 32,85, 130,0, 73,-85, 130,-55, 32,-137, -30,-33, -33);
            //所以上面那一段也可以直接寫成下面這樣

            path.push(0,-100);
            path.push(100,-100);
            path.push(-100,0);
            path.push(0,0);
            canvas.graphics.drawPoly(Laya.stage.width / 4, Laya.stage.height / 2, path, "#FF7F50");
            //依照陣列中的數字，每兩個一組下去繪製，順便一提，在這裡的座標系統為x(+往右-往左)y(+往下-往上)
        }
    }
}
new laya.Sprite_DrawPath();