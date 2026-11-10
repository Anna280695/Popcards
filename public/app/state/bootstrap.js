// Popcards legacy shared-scope script. Loaded in manifest order.
const $=s=>document.querySelector(s);
const FR=[{n:'Mai Nguyen',sc:2960,i:'MN',st:7,w:96,pk:'Travel',p:80,h:'@mai.n',mw:31,lp:'Played today'},{n:'Alex Chen',sc:1790,i:'AC',st:3,w:54,pk:'Everyday',p:40,h:'@alex.chen',mw:17,lp:'Played yesterday'},{n:'Linh Tran',sc:4400,i:'LT',st:14,w:140,pk:'Business',p:60,h:'@linh.t',mw:52,lp:'Played 2h ago'},{n:'Sam Rivera',sc:700,i:'SR',st:1,w:20,pk:'Everyday',p:15,h:'@sam.r',mw:6,lp:'Played 3 days ago'}];
const PAIRS=[['apple','quả táo'],['rice','cơm'],['water','nước'],['tea','trà'],['milk','sữa'],['bread','bánh mì']];
const VOCAB_TIERS=[
[['apple','quả táo'],['rice','cơm'],['water','nước'],['tea','trà'],['milk','sữa'],['bread','bánh mì'],['book','sách'],['house','ngôi nhà'],['cat','mèo'],['sun','mặt trời'],['school','trường học'],['friend','bạn bè']],
[['journey','hành trình'],['weather','thời tiết'],['market','chợ'],['holiday','kỳ nghỉ'],['ticket','vé'],['garden','khu vườn'],['message','tin nhắn'],['borrow','mượn'],['prepare','chuẩn bị'],['arrive','đến nơi']],
[['achieve','đạt được'],['improve','cải thiện'],['decision','quyết định'],['experience','kinh nghiệm'],['challenge','thử thách'],['opportunity','cơ hội'],['environment','môi trường'],['solution','giải pháp'],['compare','so sánh'],['explain','giải thích']],
[['significant','đáng kể'],['approach','phương pháp tiếp cận'],['perspective','góc nhìn'],['evaluate','đánh giá'],['consequence','hệ quả'],['assumption','giả định'],['negotiate','đàm phán'],['sustainable','bền vững'],['interpret','diễn giải'],['reliable','đáng tin cậy']],
[['comprehensive','toàn diện'],['ambiguous','mơ hồ'],['substantial','đáng kể'],['coherent','mạch lạc'],['hypothesis','giả thuyết'],['intricate','phức tạp'],['profound','sâu sắc'],['scrutinize','xem xét kỹ'],['inherent','vốn có'],['preliminary','sơ bộ']],
[['ubiquitous','có mặt khắp nơi'],['nuanced','tinh tế'],['meticulous','tỉ mỉ'],['paradigm','mô hình tư duy'],['conundrum','vấn đề hóc búa'],['pragmatic','thực dụng'],['discrepancy','sự khác biệt'],['resilient','kiên cường'],['eloquent','hùng hồn'],['equivocal','không rõ ràng']]
];

const EXTRA_WORD_DATA=[[["chair","ghế","Please sit on the chair."],["window","cửa sổ","Open the window for some fresh air."],["door","cửa ra vào","Close the door quietly."],["table","cái bàn","Dinner is on the table."],["pencil","bút chì","Write your name with a pencil."],["flower","bông hoa","This flower smells lovely."],["family","gia đình","My family eats together."],["morning","buổi sáng","I walk to school every morning."],["evening","buổi tối","We read together in the evening."],["orange","quả cam","She eats an orange at lunch."],["coffee","cà phê","He drinks coffee after breakfast."],["river","dòng sông","The river runs through town."],["mountain","ngọn núi","We can see the mountain from here."],["happy","vui vẻ","The children look happy today."],["quiet","yên tĩnh","The library is quiet."],["clean","sạch sẽ","Keep your room clean."],["listen","lắng nghe","Listen carefully to the teacher."],["write","viết","Write a short note."],["walk","đi bộ","We walk home together."],["play","chơi","They play in the park."]],[["discover","khám phá","We hope to discover a new trail."],["explore","khám phá","Let's explore the old city."],["schedule","lịch trình","Check the schedule before leaving."],["reservation","đặt chỗ","I made a reservation for dinner."],["luggage","hành lý","Keep your luggage close."],["direction","hướng đi","Can you show me the direction?"],["neighborhood","khu phố","This neighborhood is friendly."],["recipe","công thức nấu ăn","Follow the recipe carefully."],["ingredient","nguyên liệu","Fresh herbs are my favorite ingredient."],["traffic","giao thông","Traffic is heavy this morning."],["commute","đi lại hằng ngày","My commute takes thirty minutes."],["appointment","cuộc hẹn","I have a dentist appointment tomorrow."],["festival","lễ hội","The festival starts on Friday."],["custom","phong tục","Giving gifts is a local custom."],["tradition","truyền thống","Our family keeps this tradition."],["imagine","tưởng tượng","Imagine living by the sea."],["recommend","đề xuất","Can you recommend a good book?"],["organize","sắp xếp","I need to organize my notes."],["describe","miêu tả","Describe what you saw."],["confident","tự tin","She feels confident speaking English."]],[["adapt","thích nghi","People adapt to new situations."],["analyze","phân tích","We analyze the survey results."],["collaborate","hợp tác","The teams collaborate on the project."],["communicate","giao tiếp","We communicate through video calls."],["efficient","hiệu quả","This is an efficient process."],["evidence","bằng chứng","There is evidence to support the claim."],["flexible","linh hoạt","We need a flexible schedule."],["impact","tác động","The policy had a positive impact."],["priority","ưu tiên","Safety is our first priority."],["resource","nguồn lực","Time is a limited resource."],["strategy","chiến lược","Our strategy focuses on growth."],["benefit","lợi ích","Exercise has a clear benefit."],["identify","xác định","Identify the main problem first."],["predict","dự đoán","Experts predict a mild winter."],["require","yêu cầu","The course may require practice."],["resolve","giải quyết","They resolved the disagreement."],["maintain","duy trì","Maintain a regular study habit."],["contribute","đóng góp","Everyone can contribute an idea."],["establish","thiết lập","The company will establish new rules."],["expand","mở rộng","We plan to expand the program."]],[["advocate","ủng hộ","She will advocate for fair access."],["allocate","phân bổ","We allocate funds to each team."],["constraint","sự hạn chế","The budget is a major constraint."],["criteria","tiêu chí","These are the criteria for selection."],["derive","rút ra","We derive conclusions from data."],["distinguish","phân biệt","Can you distinguish fact from opinion?"],["emphasize","nhấn mạnh","The report will emphasize key risks."],["facilitate","tạo điều kiện","The tool can facilitate teamwork."],["fluctuate","dao động","Prices fluctuate throughout the year."],["implement","triển khai","We will implement the new policy."],["justify","biện minh","You must justify your conclusion."],["mitigate","giảm thiểu","These actions can mitigate risk."],["objective","mục tiêu","Our objective is to improve access."],["optimize","tối ưu hóa","We optimize the system for speed."],["perceive","nhận thức","People perceive the message differently."],["proportion","tỷ lệ","A large proportion agreed."],["reinforce","củng cố","Practice helps reinforce memory."],["subsequent","tiếp theo","Subsequent studies confirmed the result."],["transition","sự chuyển đổi","The transition took several months."],["validity","tính hợp lệ","Researchers questioned the validity of the test."]],[["articulate","diễn đạt rõ ràng","She can articulate complex ideas."],["corroborate","chứng thực","The records corroborate his account."],["delineate","phác họa rõ","The document delineates each role."],["empirical","dựa trên thực nghiệm","The theory needs empirical evidence."],["exacerbate","làm trầm trọng hơn","Delays may exacerbate the problem."],["feasible","khả thi","The proposal seems feasible."],["formulate","xây dựng","They formulate a new hypothesis."],["implicit","ngầm hiểu","The message contains an implicit warning."],["inference","sự suy luận","The inference follows from the results."],["integrity","tính toàn vẹn","Data integrity is essential."],["legitimate","hợp pháp","That is a legitimate concern."],["marginal","nhỏ, không đáng kể","The change had a marginal effect."],["notwithstanding","mặc dù","Notwithstanding the rain, they played."],["plausible","hợp lý","Her explanation sounds plausible."],["predominant","chiếm ưu thế","Blue is the predominant color."],["reciprocal","có đi có lại","The agreement creates reciprocal benefits."],["rigorous","nghiêm ngặt","The study uses rigorous methods."],["synthesize","tổng hợp","Students synthesize multiple sources."],["tentative","tạm thời","These findings are tentative."],["underlying","cơ bản, tiềm ẩn","We must address the underlying issue."]],[["anomaly","điểm bất thường","The analyst noticed an anomaly."],["axiomatic","hiển nhiên","The principle seems axiomatic to them."],["circumspect","thận trọng","Be circumspect when making predictions."],["dichotomy","sự phân đôi","The debate creates a false dichotomy."],["ephemeral","phù du","The excitement was ephemeral."],["esoteric","khó hiểu, chuyên sâu","The text uses esoteric terminology."],["idiosyncratic","mang tính riêng biệt","Her writing has an idiosyncratic style."],["incongruous","không phù hợp","The bright sign looked incongruous."],["intransigent","không khoan nhượng","The negotiators remained intransigent."],["juxtapose","đặt cạnh để so sánh","The exhibit will juxtapose two eras."],["laconic","ngắn gọn","His laconic reply surprised everyone."],["obfuscate","làm khó hiểu","The vague language may obfuscate the issue."],["ostensible","bề ngoài, có vẻ","The ostensible reason was a delay."],["perfunctory","qua loa","He gave the document a perfunctory glance."],["quintessential","tiêu biểu nhất","It is a quintessential example of the style."],["recalcitrant","ngoan cố","The recalcitrant committee rejected changes."],["salient","nổi bật, quan trọng","The report highlights salient findings."],["spurious","sai lệch","The conclusion relied on spurious data."],["taciturn","ít nói","The taciturn student rarely spoke."],["verisimilitude","tính giống thật","The novel achieves remarkable verisimilitude."]]];
// 80 additional intermediate English–Vietnamese pairs with usage examples.
const MEDIUM_WORD_DATA=[
  [
    "accomplish",
    "hoàn thành",
    "We can accomplish this task together."
  ],
  [
    "adjust",
    "điều chỉnh",
    "Please adjust the chair to a comfortable height."
  ],
  [
    "afford",
    "có đủ tiền mua",
    "We can afford a short holiday this year."
  ],
  [
    "approve",
    "chấp thuận",
    "The manager will approve the plan tomorrow."
  ],
  [
    "arrange",
    "sắp xếp",
    "Can you arrange the books by topic?"
  ],
  [
    "avoid",
    "tránh",
    "Leave early to avoid the traffic."
  ],
  [
    "balance",
    "cân bằng",
    "She tries to balance work and study."
  ],
  [
    "behave",
    "cư xử",
    "The children behave well in class."
  ],
  [
    "celebrate",
    "ăn mừng",
    "We celebrate our success with dinner."
  ],
  [
    "combine",
    "kết hợp",
    "Combine the flour and water in a bowl."
  ],
  [
    "confirm",
    "xác nhận",
    "Please confirm your booking by email."
  ],
  [
    "consider",
    "cân nhắc",
    "Consider all the options before you decide."
  ],
  [
    "convince",
    "thuyết phục",
    "He tried to convince me to join the team."
  ],
  [
    "deliver",
    "giao hàng",
    "They deliver fresh vegetables every morning."
  ],
  [
    "encourage",
    "khuyến khích",
    "My teacher encourages me to ask questions."
  ],
  [
    "estimate",
    "ước tính",
    "Can you estimate the cost of the trip?"
  ],
  [
    "manage",
    "quản lý",
    "She manages a small team at work."
  ],
  [
    "notice",
    "nhận thấy",
    "Did you notice the new sign?"
  ],
  [
    "participate",
    "tham gia",
    "Everyone can participate in the discussion."
  ],
  [
    "protect",
    "bảo vệ",
    "Wear a hat to protect your skin."
  ],
  [
    "advantage",
    "lợi thế",
    "Speaking two languages is an advantage."
  ],
  [
    "advice",
    "lời khuyên",
    "Thank you for your helpful advice."
  ],
  [
    "agreement",
    "thỏa thuận",
    "We reached an agreement after the meeting."
  ],
  [
    "attitude",
    "thái độ",
    "A positive attitude can make a difference."
  ],
  [
    "behavior",
    "hành vi",
    "The teacher praised his helpful behavior."
  ],
  [
    "budget",
    "ngân sách",
    "Our budget includes food and transport."
  ],
  [
    "career",
    "sự nghiệp",
    "She wants a career in education."
  ],
  [
    "community",
    "cộng đồng",
    "Our community has a new library."
  ],
  [
    "competition",
    "cuộc thi",
    "He entered a cooking competition."
  ],
  [
    "confidence",
    "sự tự tin",
    "Practice helps build your confidence."
  ],
  [
    "connection",
    "sự kết nối",
    "Travel creates a connection between cultures."
  ],
  [
    "contribution",
    "sự đóng góp",
    "Every contribution helps the project grow."
  ],
  [
    "effort",
    "nỗ lực",
    "Learning a language takes time and effort."
  ],
  [
    "equipment",
    "thiết bị",
    "Check your equipment before the match."
  ],
  [
    "expectation",
    "sự kỳ vọng",
    "The results were above our expectations."
  ],
  [
    "knowledge",
    "kiến thức",
    "Reading improves your knowledge of the world."
  ],
  [
    "progress",
    "sự tiến bộ",
    "You have made good progress this month."
  ],
  [
    "purpose",
    "mục đích",
    "What is the purpose of this meeting?"
  ],
  [
    "responsibility",
    "trách nhiệm",
    "Taking care of the garden is my responsibility."
  ],
  [
    "suggestion",
    "đề xuất",
    "Do you have a suggestion for dinner?"
  ],
  [
    "accurate",
    "chính xác",
    "The map gives accurate directions."
  ],
  [
    "available",
    "có sẵn",
    "Fresh fruit is available at the market."
  ],
  [
    "aware",
    "nhận thức được",
    "Are you aware of the new rules?"
  ],
  [
    "capable",
    "có năng lực",
    "She is capable of leading the team."
  ],
  [
    "convenient",
    "thuận tiện",
    "This bus stop is convenient for students."
  ],
  [
    "creative",
    "sáng tạo",
    "We need a creative idea for the poster."
  ],
  [
    "curious",
    "tò mò",
    "The curious child asked many questions."
  ],
  [
    "essential",
    "thiết yếu",
    "Clean water is essential for good health."
  ],
  [
    "familiar",
    "quen thuộc",
    "This song sounds familiar to me."
  ],
  [
    "generous",
    "hào phóng",
    "Our generous neighbor shared her vegetables."
  ],
  [
    "independent",
    "độc lập",
    "Living alone helped him become independent."
  ],
  [
    "necessary",
    "cần thiết",
    "A warm coat is necessary in winter."
  ],
  [
    "ordinary",
    "bình thường",
    "It was an ordinary day at school."
  ],
  [
    "patient",
    "kiên nhẫn",
    "Be patient while you wait for your turn."
  ],
  [
    "practical",
    "thiết thực",
    "She gave me practical tips for saving money."
  ],
  [
    "reasonable",
    "hợp lý",
    "The hotel offers rooms at reasonable prices."
  ],
  [
    "responsible",
    "có trách nhiệm",
    "He is a responsible member of the team."
  ],
  [
    "suitable",
    "phù hợp",
    "These shoes are suitable for walking."
  ],
  [
    "valuable",
    "có giá trị",
    "The course gave me valuable experience."
  ],
  [
    "various",
    "đa dạng",
    "The shop sells various kinds of tea."
  ],
  [
    "reduce",
    "giảm bớt",
    "We can reduce waste by using fewer bags."
  ],
  [
    "replace",
    "thay thế",
    "We need to replace the broken window."
  ],
  [
    "respond",
    "phản hồi",
    "Please respond to the invitation by Friday."
  ],
  [
    "support",
    "hỗ trợ",
    "My friends support me when I need help."
  ],
  [
    "survive",
    "sống sót",
    "These plants can survive without much water."
  ],
  [
    "volunteer",
    "tình nguyện",
    "I volunteer at the local library."
  ],
  [
    "waste",
    "lãng phí",
    "Do not waste food."
  ],
  [
    "wonder",
    "tự hỏi",
    "I wonder why the train is late."
  ],
  [
    "depend",
    "phụ thuộc",
    "Young children depend on adults for care."
  ],
  [
    "recognize",
    "nhận ra",
    "I recognize her voice on the phone."
  ],
  [
    "destination",
    "điểm đến",
    "Our final destination is a small coastal town."
  ],
  [
    "disadvantage",
    "bất lợi",
    "The long journey is the main disadvantage."
  ],
  [
    "explanation",
    "lời giải thích",
    "The teacher gave a clear explanation."
  ],
  [
    "improvement",
    "sự cải thiện",
    "There is an improvement in her pronunciation."
  ],
  [
    "permission",
    "sự cho phép",
    "Ask for permission before taking a photo."
  ],
  [
    "relationship",
    "mối quan hệ",
    "They have a close relationship with their neighbors."
  ],
  [
    "requirement",
    "yêu cầu",
    "Previous experience is not a requirement for this job."
  ],
  [
    "safety",
    "sự an toàn",
    "Your safety is our first concern."
  ],
  [
    "achievement",
    "thành tựu",
    "Finishing the course was an important achievement."
  ],
  [
    "opinion",
    "ý kiến",
    "Everyone has a different opinion about the film."
  ]
];
EXTRA_WORD_DATA[2].push(...MEDIUM_WORD_DATA);
EXTRA_WORD_DATA.forEach((bank,tier)=>bank.forEach(([word,meaning])=>VOCAB_TIERS[tier].push([word,meaning])));
const VOCAB=VOCAB_TIERS.flat();
const DIFFICULTY_NAMES=['Beginner · A1','Elementary · A2','Intermediate · B1','Upper intermediate · B2','Advanced · C1','Expert · C2'];
const WORD_EXAMPLES=new Map(EXTRA_WORD_DATA.flat().map(([w,m,example])=>[w,example]));

const ORIGINAL_EXAMPLES=["I ate an apple after lunch.", "We cooked rice for dinner.", "Drink water throughout the day.", "Would you like a cup of tea?", "She poured milk into the glass.", "This bread is fresh from the oven.", "I borrowed a book from the library.", "Their house is near the river.", "The cat is sleeping on the sofa.", "The sun rises in the east.", "Our school starts at eight.", "My friend helped me study.", "Our journey began at sunrise.", "The weather looks great today.", "We bought vegetables at the market.", "They went on holiday in June.", "Show your ticket at the gate.", "The garden is full of flowers.", "I sent a message to my sister.", "May I borrow your pen?", "Prepare your notes before class.", "We arrive at the station at noon.", "You can achieve your goals through practice.", "Reading daily can improve your vocabulary.", "We made a decision after discussing the options.", "She has experience managing projects.", "Learning a new language can be a challenge.", "This job is a great opportunity to learn.", "Protecting the environment is important.", "We found a solution to the problem.", "Compare the two options carefully.", "Please explain your answer.", "The results showed a significant improvement.", "Her approach to teaching is very practical.", "Try to understand another perspective.", "We need to evaluate the evidence.", "Every choice has a consequence.", "The plan is based on an assumption.", "They negotiate a fair agreement.", "The city adopted sustainable practices.", "How do you interpret this chart?", "Use reliable sources in your essay.", "The guide provides a comprehensive overview.", "The instructions were ambiguous.", "The project requires substantial effort.", "Your argument should be coherent.", "The experiment tests a hypothesis.", "The device has an intricate design.", "The discovery had a profound impact.", "We should scrutinize the results.", "Uncertainty is inherent in forecasting.", "These are preliminary findings.", "Smartphones are ubiquitous in modern life.", "The discussion raised a nuanced question.", "She kept meticulous notes.", "The discovery changed the scientific paradigm.", "The team faced a difficult conundrum.", "We need a pragmatic solution.", "They found a discrepancy in the records.", "The community remained resilient after the storm.", "She gave an eloquent speech.", "His equivocal response created confusion."];
VOCAB_TIERS.forEach((bank,tier)=>bank.slice(0,tier===0?12:10).forEach(([word],i)=>WORD_EXAMPLES.set(word, ORIGINAL_EXAMPLES[tier===0?i:12+(tier-1)*10+i])));
const WORD_INFO=new Map(VOCAB_TIERS.flatMap((bank,tier)=>bank.map(([w,m])=>[w,{meaning:m,tier,example:WORD_EXAMPLES.get(w)||null}])));
const getWordInfo=(word)=>WORD_INFO.get(word)||{meaning:'',tier:0,example:null};
const detailsHTML=(word)=>{const info=getWordInfo(word);return `<div class="word-details"><div class="word-details-top"><span class="word-difficulty">${DIFFICULTY_NAMES[info.tier]}</span><span class="word-tier">Tier ${info.tier+1} of 6</span></div><button type="button" class="word-speak" data-a="speak" data-v="${esc(word)}" aria-label="Hear pronunciation of ${esc(word)}">🔊 Hear ${esc(word)}</button><div class="word-definition"><b>Vietnamese meaning</b><p>${esc(info.meaning)}</p></div><div class="word-example"><b>Example in context</b><p>${info.example?esc(info.example):`Learn how to use “${esc(word)}” in a sentence.`}</p></div><small>Pronunciation uses your device's English voice when available.</small></div>`};

// Score controls the player's level. Every level promotes a harder word tier.
const LEVEL_STEP=500;
const getLevel=(points=S.playerScore)=>Math.max(1,Math.floor(Math.max(0,points)/LEVEL_STEP)+1);
const getTier=(level=getLevel())=>Math.min(VOCAB_TIERS.length-1,level-1);
const levelProgress=()=>S.playerScore%LEVEL_STEP;
const rareWord=k=>Boolean(S.R?.rareKeys?.includes(k));
const randomPairs=(count=6)=>{const tier=getTier(),pool=[...VOCAB_TIERS[tier]];for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}return pool.slice(0,count)};
const ORDER=[0,3,1,5,2,4,6,7,8,9,10,11];
const S={selectedWords:[],playedWords:[],playerScore:0,playerWins:0,flashIndex:0,flashFlipped:false,reviewCards:{},reviewMode:false,scr:'splash',authenticated:false,loginReturn:'profile',settingsReturn:'profile',learningLanguage:'English',definitionLanguage:'Vietnamese',modal:null,sel:['Mai Nguyen','Alex Chen'],ch:null,R:null,res:null,fp:null,msg:'',names:['@mai.n'],stats:{rounds:0,pairs:0,mis:0,best:0,perfect:0},confirmReset:false,gift:0,profile:{name:'Mia Nguyen',handle:'@mia.words',avatar:1},pfDraft:null};
const AVATARS=Array.from({length:22},(_,i)=>i+1);
const AVATAR_NAMES={15:'Book perch',16:'Bright idea',17:'Peekaboo',18:'Hello wave',19:'Big stretch',20:'Trophy time',21:'Cozy pause',22:'Card shuffle'};
const accuracyPct=()=>{const t=S.stats;return t.pairs+t.mis?Math.round(t.pairs/(t.pairs+t.mis)*100)+'%':'—'};
// Three clues shared across rounds, replenished 24 hours after the first use.
const CLUE_LIMIT=3,CLUE_WINDOW=24*60*60*1000,CLUE_KEY='popcards.clues.v1';
function localClueState(){let state={remaining:CLUE_LIMIT,reset_at:null};try{state=Object.assign(state,JSON.parse(localStorage.getItem(CLUE_KEY)||'null')||{})}catch(e){}
 if(state.reset_at&&Date.now()>=Date.parse(state.reset_at)){state={remaining:CLUE_LIMIT,reset_at:null};localStorage.setItem(CLUE_KEY,JSON.stringify(state))}
 return state}
function clueBalance(){return Number.isFinite(window.popcardsClueBalance)?window.popcardsClueBalance:localClueState().remaining}
function clueResetTime(){return window.popcardsClueResetAt||localClueState().reset_at}
function clueResetLabel(){const at=clueResetTime();if(!at)return '3 clues available every 24h';const ms=Math.max(0,Date.parse(at)-Date.now());if(ms<=0)return 'Clues ready to refill';return 'Clues reset in '+Math.floor(ms/3600000)+'h '+Math.ceil(ms%3600000/60000)+'m'}
async function takeClue(){if(typeof window.popcardsConsumeClue==='function')return await window.popcardsConsumeClue();const state=localClueState();if(state.remaining<=0)return false;if(!state.reset_at)state.reset_at=new Date(Date.now()+CLUE_WINDOW).toISOString();state.remaining--;localStorage.setItem(CLUE_KEY,JSON.stringify(state));return true}
const SAVE_KEY='popcards.v1',SAVE_FIELDS=['unfinishedMatch','playerScore','playerWins','playedWords','selectedWords','reviewCards','learningLanguage','definitionLanguage','authenticated','stats','profile','weekly','notifs','notifPrefs','friendReq','inCh'];
try{const d=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(d)SAVE_FIELDS.forEach(k=>{if(d[k]!==undefined)S[k]=d[k]})}catch(e){}
// Personalized review: missed words are due immediately, then 1, 3, 7, 14, 30 days.
const REVIEW_INTERVALS=[0,1,3,7,14,30];
const reviewRecord=w=>S.reviewCards[w]||null;
const reviewDue=w=>{const r=reviewRecord(w);return !!r&&r.due<=Date.now()};
const reviewWords=()=>S.playedWords.filter(p=>reviewDue(p[0])).sort((a,b)=>(reviewRecord(a[0]).due-reviewRecord(b[0]).due));
const reviewCount=()=>reviewWords().length;
function recordMiss(w){if(!WORD_INFO.has(w))return;const r=S.reviewCards[w]||{step:0,misses:0,correct:0,due:0};r.misses++;r.step=0;r.due=Date.now();S.reviewCards[w]=r;}
function rateReview(w,known){if(!WORD_INFO.has(w))return;const r=S.reviewCards[w]||{step:0,misses:0,correct:0,due:0};if(known){r.correct++;r.step=Math.min(REVIEW_INTERVALS.length-1,r.step+1)}else{r.misses++;r.step=0}r.due=Date.now()+REVIEW_INTERVALS[r.step]*86400000;S.reviewCards[w]=r;persist();}
function startDueReview(){const due=reviewWords();if(!due.length){toast('You are all caught up!');return}S.selectedWords=due.map(p=>S.playedWords.findIndex(q=>q[0]===p[0])).filter(i=>i>=0);S.reviewMode=true;S.flashIndex=0;S.flashFlipped=false;S.scr='flashcards';S.modal=null;}
const reviewTag=w=>{const r=reviewRecord(w);return !r?'New':reviewDue(w)?'Review due':r.step>=3?'Improving':'Practicing'};
const CH_SEED=()=>[{id:1,from:'Linh Tran',target:180,left:'20h left',status:'new'},{id:2,from:'Alex Chen',target:140,left:'5h left',status:'new'},{id:3,from:'Mai Nguyen',target:150,left:'Done',status:'won',score:210}];
const persist=()=>{if(new URLSearchParams(location.search).has('preview'))return;try{const d={};SAVE_FIELDS.forEach(k=>d[k]=S[k]);localStorage.setItem(SAVE_KEY,JSON.stringify(d))}catch(e){}};
S.weekly=S.weekly||{k:'',pts:0};S.friendReq=S.friendReq||[];S.inCh=S.inCh||CH_SEED();S.lbScope='global';S.lbPeriod='all';
const LBX_WK={'Mai Nguyen':620,'Alex Chen':340,'Linh Tran':910,'Sam Rivera':120};
const LBX_EXTRA=[{n:'Hana Kim',sc:6120,wk:1180,a:5,h:'@hana.k',st:21,w:210,mw:74,pk:'Business',lp:'Played today'},{n:'Diego Alvarez',sc:5240,wk:760,a:3,h:'@diego.a',st:9,w:118,mw:40,pk:'Travel',lp:'Played 1h ago'},{n:'Yuki Tanaka',sc:3810,wk:540,a:6,h:'@yuki.t',st:5,w:76,mw:25,pk:'Everyday',lp:'Played yesterday'},{n:'Priya Shah',sc:2310,wk:430,a:2,h:'@priya.s',st:3,w:52,mw:18,pk:'Travel',lp:'Played 2 days ago'},{n:'Tom Becker',sc:1200,wk:210,a:4,h:'@tom.b',st:2,w:31,mw:9,pk:'Everyday',lp:'Played 4 days ago'}];
const wkKey=()=>{const d=new Date(),m=new Date(d.getFullYear(),d.getMonth(),d.getDate()-(d.getDay()+6)%7);return m.getFullYear()+'-'+(m.getMonth()+1)+'-'+m.getDate()};
const weeklyPts=()=>S.weekly.k===wkKey()?S.weekly.pts:0;
const addWeekly=n=>{S.weekly={k:wkKey(),pts:weeklyPts()+n}};
const lbList=(g=S.lbScope==='global',wk=S.lbPeriod!=='all')=>{
 const list=window.popcardsVerifiedRankings||[];
 const friends=new Set(window.popcardsVerifiedFriendIds||[]);
 return list.filter(p=>g||p.you||friends.has(p.id))
 .map(p=>({id:p.id,n:p.n,v:wk?p.week:p.total,a:p.a||1,you:!!p.you,st:0,verified:true}))
 .sort((a,b)=>b.v-a.v||a.n.localeCompare(b.n));
};
let toastMsg='',toastUntil=0,resetTimer=null,doneTimer=null;
function finishSend(){clearTimeout(doneTimer);if(!S.pickerDone)return;S.pickerDone=null;S.modal=null;S.sentFlash=true;render()}
function resetProgress(){window.PopcardsRoundController?.stop();Object.assign(S,{playerScore:0,playerWins:0,weekly:{k:'',pts:0},notifs:NOTIF_SEED(),inCh:CH_SEED(),playedWords:[],selectedWords:[],reviewCards:{},stats:{rounds:0,pairs:0,mis:0,best:0,perfect:0},ch:null,res:null,confirmReset:false,modal:null});try{if(!new URLSearchParams(location.search).has('preview'))localStorage.removeItem(SAVE_KEY)}catch(e){}}
let tt=null,splashTimer=null; // Round timers now live in round-controller.js
function scheduleSplash(){clearTimeout(splashTimer);splashTimer=setTimeout(()=>{if(S.scr==='splash'){S.scr='welcome';render()}},2200)}
