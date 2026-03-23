const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TOKEN, { polling: true });

// =====================
const ADMIN_ID = 8455708086;

// =====================
let users = new Map();
let cooldowns = new Map();
let whisperSessions = new Map();

// =====================
function getUser(id){
    if(!users.has(id)){
        users.set(id,{
            money: 0,
            bankId: Math.floor(100000 + Math.random()*900000),
            protected: false
        });
    }
    return users.get(id);
}

function cooldown(userId, command, time){
    const key = userId + "_" + command;
    const now = Date.now();

    if(cooldowns.has(key)){
        if(now < cooldowns.get(key)) return true;
    }

    cooldowns.set(key, now + time);
    return false;
}

function rand(min,max){
    return Math.floor(Math.random()*(max-min+1))+min;
}

// =====================
// 💰 البنك
// =====================

// انشاء حساب
bot.onText(/انشاء حساب/i, msg=>{
    const user = getUser(msg.from.id);

    bot.sendMessage(msg.chat.id,
`✅ حسابك جاهز

💳 رقمك: ${user.bankId}
💰 فلوسك: ${user.money}`);
});

// حسابي
bot.onText(/حسابي/i,msg=>{
    const u = getUser(msg.from.id);
    bot.sendMessage(msg.chat.id,`💳 ${u.bankId}\n💰 ${u.money}`);
});

// فلوسي
bot.onText(/فلوسي/i,msg=>{
    bot.sendMessage(msg.chat.id,`💰 ${getUser(msg.from.id).money}`);
});

// حذف حساب (حماية)
bot.onText(/مسح حسابي/i,msg=>{
    const u = getUser(msg.from.id);
    u.protected = true;

    bot.sendMessage(msg.chat.id,"🔒 تم تفعيل الحماية (ماحد يزرفك)");
});

// تحويل
bot.onText(/^تحويل (\d+) (\d+)/i,(msg,m)=>{
    const from = getUser(msg.from.id);
    const bank = parseInt(m[1]);
    const amount = parseInt(m[2]);

    let target = null;

    for(let [id,data] of users){
        if(data.bankId === bank) target = id;
    }

    if(!target) return bot.sendMessage(msg.chat.id,"❌ خطأ");
    if(from.money < amount) return bot.sendMessage(msg.chat.id,"❌ فلوسك ما تكفي");

    from.money -= amount;
    users.get(target).money += amount;

    bot.sendMessage(msg.chat.id,"✅ تم التحويل");
});

// =====================
// 🎮 فلوس
// =====================

// راتب
bot.onText(/راتب/i,msg=>{
    if(cooldown(msg.from.id,"salary",60000))
        return bot.sendMessage(msg.chat.id,"⏳ انتظر");

    let u = getUser(msg.from.id);
    let m = rand(50,150);

    u.money += m;

    bot.sendMessage(msg.chat.id,`💼 ${m}`);
});

// بخشيش
bot.onText(/بخشيش/i,msg=>{
    if(cooldown(msg.from.id,"tip",30000))
        return;

    let u = getUser(msg.from.id);
    let m = rand(10,50);

    u.money += m;

    bot.sendMessage(msg.chat.id,`💸 ${m}`);
});

// قرض
bot.onText(/قرض/i,msg=>{
    if(cooldown(msg.from.id,"loan",120000))
        return;

    let u = getUser(msg.from.id);
    u.money += 200;

    bot.sendMessage(msg.chat.id,"🏦 200");
});

// مضاربه
bot.onText(/مضاربه/i,msg=>{
    if(cooldown(msg.from.id,"trade",20000))
        return;

    let u = getUser(msg.from.id);

    if(Math.random()>0.5){
        let win = rand(20,100);
        u.money += win;
        bot.sendMessage(msg.chat.id,`📈 ${win}`);
    }else{
        let lose = rand(10,50);
        u.money -= lose;
        bot.sendMessage(msg.chat.id,`📉 ${lose}`);
    }
});

// حظ
bot.onText(/حظ/i,msg=>{
    let u = getUser(msg.from.id);

    if(rand(1,100)>70){
        u.money += 200;
        bot.sendMessage(msg.chat.id,"🎉 +200");
    }else{
        bot.sendMessage(msg.chat.id,"😢");
    }
});

// عجله
bot.onText(/عجله/i,msg=>{
    let u = getUser(msg.from.id);

    let ops = [100,-50,u.money,-u.money];
    let val = ops[rand(0,ops.length-1)];

    u.money += val;

    bot.sendMessage(msg.chat.id,`🎡 ${val}`);
});

// =====================
// 🕵️‍♂️ زرف
// =====================
bot.onText(/زرف/i, async msg=>{
    if(!msg.reply_to_message)
        return bot.sendMessage(msg.chat.id,"❌ رد على الشخص");

    if(cooldown(msg.from.id,"steal",720000))
        return bot.sendMessage(msg.chat.id,"⏳ بعد 12 دقيقة");

    let thief = getUser(msg.from.id);
    let victimId = msg.reply_to_message.from.id;
    let victim = getUser(victimId);

    if(victim.protected)
        return bot.sendMessage(msg.chat.id,"🔒 هذا الشخص محمي");

    if(Math.random()>0.5){
        let amount = rand(20,100);

        if(victim.money < amount) amount = victim.money;

        victim.money -= amount;
        thief.money += amount;

        bot.sendMessage(msg.chat.id,`🕵️ سرقت ${amount}`);
    }else{
        bot.sendMessage(msg.chat.id,"🚨 انمسكت!");
    }
});

// =====================
// 🏆 التوب
// =====================
bot.onText(/توب/i,msg=>{
    let arr = [...users.entries()]
    .sort((a,b)=>b[1].money - a[1].money)
    .slice(0,10);

    let text = "🏆 التوب:\n";

    arr.forEach((u,i)=>{
        text += `${i+1}- ${u[1].money}\n`;
    });

    bot.sendMessage(msg.chat.id,text);
});

// =====================
// 👑 ادمن
// =====================
bot.onText(/^اضف فلوس (\d+)/i,(msg,m)=>{
    if(msg.from.id !== ADMIN_ID) return;

    let u = getUser(msg.from.id);
    u.money += parseInt(m[1]);

    bot.sendMessage(msg.chat.id,"✅");
});

// =====================
// 💌 همسة
// =====================
bot.onText(/^همسه/i, async msg=>{
    if(!msg.reply_to_message)
        return bot.sendMessage(msg.chat.id,"رد على شخص");

    let toId = msg.reply_to_message.from.id;

    bot.sendMessage(msg.chat.id,"📩 اضغط",{
        reply_markup:{
            inline_keyboard:[
                [{
                    text:"✉️ همسه",
                    url:`https://t.me/YOUR_BOT_USERNAME?start=w_${toId}`
                }]
            ]
        }
    });
});

bot.onText(/\/start (.+)/,(msg,m)=>{
    let data = m[1];

    if(data.startsWith("w_")){
        let toId = parseInt(data.split("_")[1]);

        whisperSessions.set(msg.from.id,{toId});

        bot.sendMessage(msg.chat.id,"/whisper اكتب");
    }
});

bot.onText(/\/whisper (.+)/, async (msg,m)=>{
    if(!whisperSessions.has(msg.from.id)) return;

    let {toId} = whisperSessions.get(msg.from.id);
    let text = m[1];

    let ids = [msg.from.id,toId,ADMIN_ID];

    for(let id of ids){
        try{
            await bot.sendMessage(id,`💌 ${text}`);
        }catch{}
    }

    whisperSessions.delete(msg.from.id);
});