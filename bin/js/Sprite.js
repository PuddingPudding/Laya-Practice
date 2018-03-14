// // 程序入口
// class Main{
//     //需要切换的图片资源路径
//     private monkey1:string = "img/fb.png";
//     private monkey2:string = "img/dies.png";
//     //切换状态
//     private flag:boolean = false;
//     private img:Laya.Sprite;
//     constructor()
//     {
//         //初始化引擎
//         Laya.init(1334,750);
//         //设置舞台背景色
//         Laya.stage.bgColor = "#ffffff";
//         this.img = new Laya.Sprite();
//         //显示绘制的图片
//         this.switchImg();
//         //侦听switchImg中图片区域的点击事件，触发后执行switchImg切换图片
//         this.img.on(Laya.Event.CLICK,this,this.switchImg);
//         //将图片添加到舞台
//         Laya.stage.addChild(this.img);
//     }
//     private switchImg():void{
//         //清空图片
//         this.img.graphics.clear();
//         //获得要切换的图片资源路径
//         var imgUrl:string = (this.flag = !this.flag)? this.monkey1:this.monkey2;
//         //加载显示图片，坐标位于100,50
//         this.img.loadImage(imgUrl,100,50);
//     }
// }
// new Main();
//# sourceMappingURL=Sprite.js.map