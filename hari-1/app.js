const HEROES_DB = [
  {"key":"1","name":"Linda","atr":"1/linda","rarity":1,"element":"basic","role":"ranged","weapon":null,"weaponType":null},
  {"key":"2","name":"Bob","atr":"1/bob","rarity":1,"element":"basic","role":"melee","weapon":null,"weaponType":null},
  {"key":"3","name":"Hyper","atr":"1/hyper","rarity":1,"element":"fire","role":"melee","weapon":null,"weaponType":null},
  {"key":"4","name":"Maria","atr":"1/maria","rarity":1,"element":"fire","role":"melee","weapon":null,"weaponType":null},
  {"key":"5","name":"Lisa","atr":"1/lisa","rarity":1,"element":"earth","role":"ranged","weapon":null,"weaponType":null},
  {"key":"6","name":"Leah","atr":"1/leah","rarity":1,"element":"earth","role":"ranged","weapon":null,"weaponType":null},
  {"key":"7","name":"Jay","atr":"1/jay","rarity":1,"element":"basic","role":"melee","weapon":null,"weaponType":null},
  {"key":"8","name":"Dragon","atr":"1/dragon","rarity":1,"element":"light","role":"melee","weapon":null,"weaponType":null},
  {"key":"9","name":"Blade","atr":"1/blade","rarity":1,"element":"water","role":"melee","weapon":null,"weaponType":null},
  {"key":"10","name":"Mina","atr":"1/mina","rarity":1,"element":"fire","role":"ranged","weapon":null,"weaponType":null},
  {"key":"11","name":"Hoshida","atr":"1/hoshida","rarity":1,"element":"dark","role":"melee","weapon":null,"weaponType":null},
  {"key":"12","name":"Peggy","atr":"1/peggy","rarity":1,"element":"dark","role":"supp","weapon":null,"weaponType":null},
  {"key":"13","name":"Ailie","atr":"1/ailie","rarity":1,"element":"fire","role":"supp","weapon":null,"weaponType":null},
  {"key":"14","name":"Oralie","atr":"1/oralie","rarity":1,"element":"dark","role":"ranged","weapon":null,"weaponType":null},
  {"key":"15","name":"Kang","atr":"1/kang","rarity":1,"element":"light","role":"melee","weapon":null,"weaponType":null},
  {"key":"16","name":"Agatha","atr":"1/agatha","rarity":1,"element":"water","role":"melee","weapon":null,"weaponType":null},
  {"key":"17","name":"DaVinci","atr":"1/davinci","rarity":1,"element":"water","role":"melee","weapon":null,"weaponType":null},
  {"key":"18","name":"Kate","atr":"1/kate","rarity":1,"element":"earth","role":"ranged","weapon":null,"weaponType":null},
  {"key":"19","name":"Zoe","atr":"1/zoe","rarity":1,"element":"dark","role":"ranged","weapon":null,"weaponType":null},
  {"key":"20","name":"Rio","atr":"1/rio","rarity":1,"element":"earth","role":"ranged","weapon":null,"weaponType":null},
  {"key":"21","name":"Nyan","atr":"1/nyan","rarity":2,"element":"basic","role":"ranged","weapon":null,"weaponType":null},
  {"key":"22","name":"Marty Junior","atr":"1/martyjr","rarity":1,"element":"earth","role":"ranged","weapon":null,"weaponType":null},
  {"key":"23","name":"Eva","atr":"eva","rarity":2,"element":"light","role":"ranged","weapon":"Justice","weaponType":"staff"},
  {"key":"24","name":"White Beast","atr":"whi2","rarity":2,"element":"water","role":"melee","weapon":"Fenrir","weaponType":"claw"},
  {"key":"25","name":"Loraine","atr":"lor","rarity":2,"element":"basic","role":"supp","weapon":"Emma","weaponType":"basket"},
  {"key":"26","name":"Lavi","atr":"lav","rarity":2,"element":"fire","role":"tank","weapon":"Pulverizer","weaponType":"gauntlet"},
  {"key":"27","name":"Favi","atr":"fav","rarity":2,"element":"water","role":"supp","weapon":"Jack Frost","weaponType":"basket"},
  {"key":"28","name":"Aoba","atr":"aob","rarity":2,"element":"earth","role":"supp","weapon":"Oberon","weaponType":"bow"},
  {"key":"29","name":"Gremory","atr":"grem","rarity":2,"element":"dark","role":"ranged","weapon":"Curiosity Solver","weaponType":"basket"},
  {"key":"30","name":"Rachel","atr":"rac","rarity":2,"element":"water","role":"ranged","weapon":"Blue Rose","weaponType":"rifle"},
  {"key":"31","name":"Hekate","atr":"hek","rarity":2,"element":"earth","role":"ranged","weapon":"Negotiator","weaponType":"rifle"},
  {"key":"32","name":"Marianne","atr":"mar2","rarity":2,"element":"earth","role":"ranged","weapon":"Merciless","weaponType":"rifle"},
  {"key":"33","name":"Sohee","atr":"soh2","rarity":2,"element":"light","role":"ranged","weapon":"Magiton Buster","weaponType":"rifle"},
  {"key":"34","name":"Marvin","atr":"mar3","rarity":2,"element":"earth","role":"melee","weapon":"Vulkan","weaponType":"gauntlet"},
  {"key":"35","name":"Akayuki","atr":"aka","rarity":2,"element":"fire","role":"melee","weapon":"Murasame","weaponType":"1h-sword"},
  {"key":"36","name":"Ranpang","atr":"ran","rarity":2,"element":"basic","role":"tank","weapon":"Firm Determination","weaponType":"claw"},
  {"key":"37","name":"Yuze","atr":"yuz2","rarity":2,"element":"dark","role":"melee","weapon":"Tartaros","weaponType":"2h-sword"},
  {"key":"38","name":"Aisha","atr":"ais","rarity":2,"element":"light","role":"supp","weapon":"Veritas","weaponType":"1h-sword"},
  {"key":"39","name":"Shapira","atr":"sha2","rarity":2,"element":"dark","role":"melee","weapon":"Fafnir","weaponType":"2h-sword"},
  {"key":"40","name":"Dolf","atr":"dol","rarity":2,"element":"fire","role":"ranged","weapon":"Helios","weaponType":"staff"},
  {"key":"41","name":"Amy","atr":"amy2","rarity":2,"element":"basic","role":"melee","weapon":"Geminus","weaponType":"2h-sword"},
  {"key":"42","name":"Girgas","atr":"gir","rarity":2,"element":"fire","role":"ranged","weapon":"Wrath of Dragon","weaponType":"staff"},
  {"key":"43","name":"Catherine","atr":"cat","rarity":2,"element":"water","role":"ranged","weapon":"Marauder","weaponType":"bow"},
  {"key":"44","name":"Plitvice","atr":"pli","rarity":3,"element":"fire","role":"melee","weapon":"Prominence","weaponType":"2h-sword"},
  {"key":"45","name":"Lapice","atr":"lap","rarity":3,"element":"light","role":"melee","weapon":"Innocent","weaponType":"1h-sword"},
  {"key":"46","name":"Marina","atr":"mar","rarity":3,"element":"water","role":"tank","weapon":"Armada","weaponType":"1h-sword"},
  {"key":"47","name":"Arabelle","atr":"arab","rarity":3,"element":"dark","role":"ranged","weapon":"Genocide","weaponType":"rifle"},
  {"key":"48","name":"Idol Eva","atr":"ido","rarity":3,"element":"basic","role":"supp","weapon":"Angel Voice","weaponType":"staff"},
  {"key":"49","name":"Bari","atr":"bar","rarity":3,"element":"earth","role":"ranged","weapon":"Mayreel","weaponType":"basket"},
  {"key":"50","name":"Lupina","atr":"lup","rarity":3,"element":"dark","role":"melee","weapon":"Amarok","weaponType":"staff"},
  {"key":"51","name":"Lahn","atr":"lah","rarity":3,"element":"basic","role":"melee","weapon":"Pure Mind","weaponType":"gauntlet"},
  {"key":"52","name":"Eugene","atr":"eug","rarity":3,"element":"light","role":"melee","weapon":"Brave Heart","weaponType":"2h-sword"},
  {"key":"53","name":"Tinia","atr":"tin","rarity":3,"element":"earth","role":"ranged","weapon":"Sarnga","weaponType":"bow"},
  {"key":"54","name":"Vishuvac","atr":"vis","rarity":3,"element":"fire","role":"melee","weapon":"Volcanic Horn","weaponType":"claw"},
  {"key":"55","name":"Nari","atr":"nar","rarity":3,"element":"basic","role":"ranged","weapon":"Sage Bead","weaponType":"basket"},
  {"key":"56","name":"Bianca","atr":"bia","rarity":3,"element":"water","role":"ranged","weapon":"Astarte","weaponType":"2h-sword"},
  {"key":"57","name":"Oghma","atr":"ogh","rarity":3,"element":"dark","role":"tank","weapon":"Eckesachs","weaponType":"1h-sword"},
  {"key":"58","name":"Alef","atr":"ale","rarity":3,"element":"earth","role":"melee","weapon":"Ouros","weaponType":"gauntlet"},
  {"key":"59","name":"Miya","atr":"miy","rarity":3,"element":"fire","role":"supp","weapon":"Shangri La","weaponType":"basket"},
  {"key":"60","name":"Future Princess","atr":"fp","rarity":3,"element":"light","role":"tank","weapon":"Liberator","weaponType":"staff"},
  {"key":"61","name":"Garam","atr":"gar","rarity":3,"element":"water","role":"ranged","weapon":"Thousand Thunder","weaponType":"bow"},
  {"key":"62","name":"Beth","atr":"bet","rarity":3,"element":"dark","role":"melee","weapon":"Predator","weaponType":"2h-sword"},
  {"key":"63","name":"Rie","atr":"rie","rarity":2,"element":"basic","role":"ranged","weapon":"Victoria","weaponType":"1h-sword"},
  {"key":"64","name":"Rue","atr":"rue","rarity":3,"element":"earth","role":"melee","weapon":"Terminator","weaponType":"rifle"},
  {"key":"65","name":"Neva","atr":"nev","rarity":2,"element":"light","role":"melee","weapon":null,"weaponType":null},
  {"key":"66","name":"Gabriel","atr":"gab","rarity":3,"element":"light","role":"supp","weapon":"Magnificat","weaponType":"bow"},
  {"key":"67","name":"Lynn","atr":"lyn","rarity":3,"element":"fire","role":"melee","weapon":"Red Lotus","weaponType":"1h-sword"},
  {"key":"68","name":"Future Knight","atr":"fk","rarity":3,"element":"basic","role":"melee","weapon":"Cosmic Destroyer","weaponType":"rifle"},
  {"key":"69","name":"Veronica","atr":"ver","rarity":3,"element":"water","role":"supp","weapon":"Messiah","weaponType":"staff"},
  {"key":"70","name":"Noxia","atr":"nox","rarity":3,"element":"dark","role":"supp","weapon":"Furfur","weaponType":"basket"},
  {"key":"71","name":"Mayreel","atr":"may","rarity":3,"element":"earth","role":"supp","weapon":"Solaris","weaponType":"claw"},
  {"key":"72","name":"Mk.99","atr":"mk9","rarity":3,"element":"light","role":"ranged","weapon":"Omega Blaster","weaponType":"rifle"},
  {"key":"73","name":"Lilith","atr":"lil","rarity":3,"element":"dark","role":"melee","weapon":"Queen's Grace","weaponType":"claw"},
  {"key":"74","name":"Lucy","atr":"luc","rarity":3,"element":"fire","role":"ranged","weapon":"Fantasia","weaponType":"staff"},
  {"key":"75","name":"Sohee (Scientist on the Beach)","atr":"soh","rarity":3,"element":"basic","role":"melee","weapon":"Nereid","weaponType":"2h-sword"},
  {"key":"76","name":"Yuze (Lifeguard)","atr":"yuz","rarity":3,"element":"water","role":"melee","weapon":"Ocean Keeper","weaponType":"2h-sword"},
  {"key":"77","name":"Eleanor","atr":"ele","rarity":3,"element":"light","role":"supp","weapon":"Benedicuts","weaponType":"basket"},
  {"key":"78","name":"Scintilla","atr":"sci","rarity":3,"element":"fire","role":"melee","weapon":"Ifrit","weaponType":"gauntlet"},
  {"key":"79","name":"Erina","atr":"eri","rarity":3,"element":"basic","role":"tank","weapon":"Balmung","weaponType":"1h-sword"},
  {"key":"80","name":"Kamael","atr":"kam","rarity":3,"element":"earth","role":"supp","weapon":"Equinox","weaponType":"staff"},
  {"key":"81","name":"Mk.2","atr":"mk2","rarity":3,"element":"dark","role":"ranged","weapon":"Rebellion","weaponType":"rifle"},
  {"key":"82","name":"Orca","atr":"orc","rarity":3,"element":"water","role":"ranged","weapon":"Nemesis","weaponType":"rifle"},
  {"key":"83","name":"Kanna","atr":"kan","rarity":3,"element":"basic","role":"melee","weapon":"Mind Snap","weaponType":"staff"},
  {"key":"84","name":"Hana","atr":"han","rarity":3,"element":"water","role":"melee","weapon":"Unchained","weaponType":"staff"},
  {"key":"85","name":"Carol","atr":"car","rarity":3,"element":"light","role":"melee","weapon":"Little Star","weaponType":"1h-sword"},
  {"key":"86","name":"Clara","atr":"clar","rarity":3,"element":"fire","role":"ranged","weapon":"Paimon's Fragment III","weaponType":"bow"},
  {"key":"87","name":"Parvati","atr":"par","rarity":3,"element":"earth","role":"melee","weapon":"Office Supply","weaponType":"gauntlet"},
  {"key":"88","name":"Lina","atr":"lin","rarity":2,"element":"fire","role":"ranged","weapon":"Demon's Blood Talisman","weaponType":"gauntlet"},
  {"key":"89","name":"Gourry","atr":"gou","rarity":2,"element":"light","role":"melee","weapon":"Sword of Light","weaponType":"2h-sword"},
  {"key":"90","name":"Xellos","atr":"xel","rarity":2,"element":"dark","role":"supp","weapon":"Xellos' Staff","weaponType":"staff"},
  {"key":"91","name":"Priscilla","atr":"pri","rarity":3,"element":"light","role":"ranged","weapon":"Eclipse","weaponType":"basket"},
  {"key":"92","name":"Claude","atr":"cla","rarity":3,"element":"dark","role":"ranged","weapon":"Twilight","weaponType":"gauntlet"},
  {"key":"93","name":"Ara","atr":"ara","rarity":3,"element":"water","role":"supp","weapon":"Bringer of Tranquility","weaponType":"basket"},
  {"key":"94","name":"Rey","atr":"rey","rarity":3,"element":"fire","role":"melee","weapon":"Heavenly Perfection","weaponType":"1h-sword"},
  {"key":"95","name":"AA72","atr":"aa7","rarity":3,"element":"water","role":"ranged","weapon":"Blue Spear","weaponType":"rifle"},
  {"key":"96","name":"Loraine (Summer Innkeeper)","atr":"lorr","rarity":3,"element":"basic","role":"ranged","weapon":"Ocean Call","weaponType":"basket"},
  {"key":"97","name":"Mad Panda Trio","atr":"pan","rarity":3,"element":"earth","role":"melee","weapon":"Prestige","weaponType":"gauntlet"},
  {"key":"98","name":"Miss Chrom","atr":"chr","rarity":3,"element":"basic","role":"ranged","weapon":"Black Mamba","weaponType":"rifle"},
  {"key":"99","name":"Valencia","atr":"val","rarity":3,"element":"light","role":"melee","weapon":"Arges","weaponType":"1h-sword"},
  {"key":"100","name":"Crosselle","atr":"cro","rarity":3,"element":"dark","role":"supp","weapon":"Permission Denied","weaponType":"gauntlet"},
  {"key":"101","name":"Andras","atr":"and","rarity":3,"element":"water","role":"ranged","weapon":"Head Hunter","weaponType":"staff"},
  {"key":"102","name":"Sumire","atr":"sum","rarity":3,"element":"dark","role":"melee","weapon":"Kagemaru","weaponType":"claw"},
  {"key":"103","name":"Pymon","atr":"pym","rarity":3,"element":"fire","role":"tank","weapon":"Planet Buster","weaponType":"gauntlet"},
  {"key":"104","name":"Elvira","atr":"elv","rarity":2,"element":"fire","role":"ranged","weapon":null,"weaponType":null},
  {"key":"105","name":"Craig","atr":"cra","rarity":2,"element":"earth","role":"tank","weapon":null,"weaponType":null},
  {"key":"106","name":"Dai","atr":"dai","rarity":2,"element":"basic","role":"melee","weapon":null,"weaponType":null},
  {"key":"107","name":"Maam","atr":"maa","rarity":2,"element":"earth","role":"supp","weapon":null,"weaponType":null},
  {"key":"108","name":"Popp","atr":"pop","rarity":2,"element":"fire","role":"ranged","weapon":null,"weaponType":null},
  {"key":"109","name":"Rosetta","atr":"ros","rarity":3,"element":"earth","role":"ranged","weapon":"Ratel","weaponType":"rifle"},
  {"key":"110","name":"White Snow","atr":"whi","rarity":3,"element":"water","role":"melee","weapon":"Snow Maker","weaponType":"gauntlet"},
  {"key":"111","name":"Karina","atr":"kar","rarity":2,"element":"dark","role":"supp","weapon":null,"weaponType":null},
  {"key":"112","name":"Fei / Mei","atr":"feimei","rarity":2,"element":"light","role":"melee","weapon":null,"weaponType":null},
  {"key":"113","name":"1st Corps Commander","atr":"fcc","rarity":3,"element":"dark","role":"ranged","weapon":"Fail-not","weaponType":"staff"},
  {"key":"114","name":"KAI","atr":"kai","rarity":3,"element":"light","role":"melee","weapon":"Durendal","weaponType":"1h-sword"},
  {"key":"115","name":"Chun Ryeo","atr":"chu","rarity":3,"element":"light","role":"ranged","weapon":"Secret Book of the Shen Mountain Fist","weaponType":"basket"},
  {"key":"116","name":"Ameris","atr":"ame","rarity":3,"element":"earth","role":"ranged","weapon":"Dragon Fang","weaponType":"claw"},
  {"key":"117","name":"Sia","atr":"sia","rarity":3,"element":"water","role":"supp","weapon":"Ocean's Tear","weaponType":"basket"},
  {"key":"118","name":"Amy (Beach Maid)","atr":"amy","rarity":3,"element":"fire","role":"melee","weapon":"Parashu","weaponType":"1h-sword"},
  {"key":"119","name":"Eunha","atr":"eun","rarity":3,"element":"basic","role":"ranged","weapon":"Infinite Change","weaponType":"basket"},
  {"key":"120","name":"Shapira (Beach Dragon Knight)","atr":"sha","rarity":3,"element":"light","role":"melee","weapon":"Loyal Shovel","weaponType":"2h-sword"},
  {"key":"121","name":"Morrian","atr":"mor","rarity":3,"element":"earth","role":"tank","weapon":"Alraune","weaponType":"1h-sword"},
  {"key":"122","name":"Vinette","atr":"vin","rarity":3,"element":"dark","role":"supp","weapon":"Nanoparticle Accelerator","weaponType":"rifle"},
  {"key":"123","name":"Win Ling","atr":"win","rarity":3,"element":"fire","role":"melee","weapon":"Refiner's Flame","weaponType":"gauntlet"},
  {"key":"124","name":"Odile","atr":"odi","rarity":3,"element":"light","role":"melee","weapon":"Trouble Shooter","weaponType":"claw"},
  {"key":"125","name":"Mikke","atr":"mik","rarity":3,"element":"basic","role":"melee","weapon":"Chisui","weaponType":"1h-sword"},
  {"key":"126","name":"Coco","atr":"coc","rarity":2,"element":"water","role":"ranged","weapon":"Witch Heart","weaponType":"staff"},
  {"key":"127","name":"Angie","atr":"ang","rarity":3,"element":"water","role":"melee","weapon":"Gloria","weaponType":"1h-sword"},
  {"key":"128","name":"Plague Doctor","atr":"pd","rarity":3,"element":"dark","role":"melee","weapon":"Repentance","weaponType":"staff"},
  {"key":"129","name":"Yuna","atr":"yuna","rarity":3,"element":"earth","role":"supp","weapon":"Restriction","weaponType":"bow"},
  {"key":"130","name":"Rimuru Tempest","atr":"rim","rarity":2,"element":"water","role":"melee","weapon":"Sword of Rimuru","weaponType":"1h-sword"},
  {"key":"131","name":"Shuna","atr":"shu","rarity":2,"element":"fire","role":"supp","weapon":"Shuna's Staff","weaponType":"staff"},
  {"key":"132","name":"Milim Nava","atr":"mil","rarity":2,"element":"dark","role":"melee","weapon":"Dragon Knuckles","weaponType":"claw"},
  {"key":"133","name":"Estel","atr":"est","rarity":3,"element":"earth","role":"ranged","weapon":"Odyssey","weaponType":"bow"},
  {"key":"134","name":"Toga","atr":"tog","rarity":3,"element":"fire","role":"ranged","weapon":"Formidable Courage","weaponType":"rifle"},
  {"key":"135","name":"Yun","atr":"yun","rarity":3,"element":"water","role":"supp","weapon":"Dragon Spring Sword","weaponType":"1h-sword"},
  {"key":"136","name":"Knight","atr":"kni","rarity":2,"element":"basic","role":"melee","weapon":"Libera","weaponType":"1h-sword"},
  {"key":"137","name":"Cornet","atr":"cor","rarity":3,"element":"light","role":"ranged","weapon":"Pouch of Verdure","weaponType":"basket"},
  {"key":"138","name":"Lena","atr":"len","rarity":3,"element":"light","role":"ranged","weapon":"Celestial Orb","weaponType":"basket"},
  {"key":"139","name":"Dabin","atr":"dab","rarity":3,"element":"earth","role":"ranged","weapon":"Heavenly Cannon","weaponType":"rifle"},
  {"key":"140","name":"Rachel (Beach)","atr":"rac3","rarity":3,"element":"water","role":"melee","weapon":"Milkyway Trophy","weaponType":"1h-sword"},
  {"key":"141","name":"Saya","atr":"say","rarity":3,"element":"fire","role":"melee","weapon":"Ghost-Cutter Sword","weaponType":"1h-sword"},
  {"key":"142","name":"Anna","atr":"ann","rarity":3,"element":"basic","role":"ranged","weapon":"Gunbrella","weaponType":"rifle"},
  {"key":"143","name":"Ruri","atr":"rur","rarity":3,"element":"light","role":"ranged","weapon":"Inter-V","weaponType":"staff"},
  {"key":"144","name":"Dohwa","atr":"doh","rarity":3,"element":"basic","role":"ranged","weapon":"Serendipity","weaponType":"basket"},
  {"key":"145","name":"Natsume","atr":"nat","rarity":3,"element":"water","role":"melee","weapon":"Hisame","weaponType":"1h-sword"},
  {"key":"146","name":"Tasha","atr":"tas","rarity":3,"element":"earth","role":"melee","weapon":"Jade Spear of Exorcism","weaponType":"staff"},
  {"key":"147","name":"Stark","atr":"sta","rarity":2,"element":"fire","role":"melee","weapon":"Stark's Axe","weaponType":"2h-sword"},
  {"key":"148","name":"Frieren","atr":"frie","rarity":2,"element":"light","role":"ranged","weapon":"Frieren's Staff","weaponType":"staff"},
  {"key":"149","name":"Fern","atr":"fer","rarity":2,"element":"basic","role":"ranged","weapon":"Fern's Staff","weaponType":"staff"},
  {"key":"150","name":"Ameris (Chocolate Collector)","atr":"ameb","rarity":3,"element":"basic","role":"supp","weapon":"Sweet Radar","weaponType":"staff"},
  {"key":"151","name":"Nifty","atr":"nif","rarity":3,"element":"dark","role":"ranged","weapon":"Overdrive Cannon","weaponType":"rifle"},
  {"key":"152","name":"Girgas (Sweet Troublemaker)","atr":"girb","rarity":3,"element":"basic","role":"melee","weapon":"Sweet Hatchling","weaponType":"2h-sword"},
  {"key":"153","name":"Callie","atr":"cal","rarity":3,"element":"dark","role":"melee","weapon":"Bloody Fist","weaponType":"gauntlet"},
  {"key":"154","name":"J","atr":"j","rarity":3,"element":"water","role":"ranged","weapon":"Delphines","weaponType":"bow"},
  {"key":"155","name":"Daisy","atr":"dais","rarity":3,"element":"water","role":"tank","weapon":"Icicle Baron","weaponType":"2h-sword"},
  {"key":"156","name":"Xiaoman","atr":"xia","rarity":3,"element":"earth","role":"melee","weapon":"Unstoppable Momentum","weaponType":"gauntlet"},
  {"key":"157","name":"Rie (Beach 4th Hitter)","atr":"rieb","rarity":3,"element":"basic","role":"melee","weapon":"Ultimate Victoria","weaponType":"2h-sword"},
  {"key":"158","name":"Randi","atr":"rand","rarity":3,"element":"fire","role":"ranged","weapon":"Summer Dreamer","weaponType":"gauntlet"},
  {"key":"159","name":"Chriselle","atr":"chri","rarity":3,"element":"earth","role":"ranged","weapon":"Acorn Rifle","weaponType":"rifle"},
  {"key":"160","name":"Kahlor","atr":"kha","rarity":3,"element":"fire","role":"melee","weapon":"Volcanic Fury","weaponType":"2h-sword"},
  {"key":"161","name":"Illuni","atr":"ill","rarity":3,"element":"light","role":"ranged","weapon":"Talisman of Mana","weaponType":"basket"},
  {"key":"162","name":"Wakamo","atr":"wak","rarity":3,"element":"water","role":"melee","weapon":"Entirety","weaponType":"basket"},
  {"key":"163","name":"Haruka","atr":"har","rarity":3,"element":"light","role":"melee","weapon":"Star Power Tiara","weaponType":"staff"},
  {"key":"164","name":"Noel","atr":"noe","rarity":3,"element":"earth","role":"supp","weapon":"Gnome Medical Bag","weaponType":"basket"},
  {"key":"165","name":"Klen","atr":"kle","rarity":2,"element":"dark","role":"ranged","weapon":"Book of Toah","weaponType":"basket"},
  {"key":"166","name":"Nelluru","atr":"nel","rarity":2,"element":"fire","role":"tank","weapon":"Dark Ichor Fist","weaponType":"gauntlet"},
  {"key":"167","name":"Alicia","atr":"ali","rarity":2,"element":"basic","role":"melee","weapon":"Stream Splitter","weaponType":"1h-sword"},
  {"key":"168","name":"Lacryma","atr":"lac","rarity":3,"element":"light","role":"ranged","weapon":"Volcanic Grimoire","weaponType":"basket"}
];

// ==========================================================
// GUARDIAN TALES GACHA SIMULATOR - HARI 1
// Simulator gacha dengan data hero & senjata asli dari API gtales.top
// ==========================================================

// ---------- Konfigurasi Gacha Rates ----------
// Rates Hero: 3-Star (Unique) 2.75%, 2-Star (Rare) 19.00%, 1-Star (Normal) 78.25%
const RATE_HERO_3 = 0.0275;
const RATE_HERO_2 = 0.1900;

// Rates Weapon: 5-Star Exclusive 3.00%, 4-Star Legend 9.00%, Normal Equipment 88.00%
const RATE_WEAP_5 = 0.0300;
const RATE_WEAP_4 = 0.0900;

const SOFT_PITY_MAX = 30; // Garansi dapat bintang 3/bintang 5 eksklusif dalam 30 tarikan

// Generic weapon list for normal equipment drops
const GENERIC_WEAPONS = [
  { name: "Bastard Sword", type: "1h-sword", rarity: 3 },
  { name: "Knight Bow", type: "bow", rarity: 3 },
  { name: "Steel Shield", type: "shield", rarity: 3 },
  { name: "Magician Staff", type: "staff", rarity: 3 },
  { name: "Iron Claw", type: "claw", rarity: 3 },
  { name: "Trainer Basket", type: "basket", rarity: 3 },
  { name: "Old Rifle", type: "rifle", rarity: 3 },
  { name: "Training Gauntlets", type: "gauntlet", rarity: 3 },
  { name: "Giant Axe", type: "2h-sword", rarity: 3 }
];

// ---------- State Game ----------
let gems = 10000;
let mileage = 0;
let crystals = 0;
let totalPulls = 0;
let softPityHero = 0;
let softPityWeapon = 0;

// Koleksi: menyimpan item yang didapat dan jumlahnya
// Format: { "key_hero/nama_senjata": jumlah }
let inventory = {
  heroes: {},
  weapons: {}
};

// Banner saat ini: 'hero-rateup', 'hero-normal', 'weapon-rateup', 'weapon-normal'
let currentBanner = 'hero-rateup';

// Hero dan Senjata Rate-up default
const RATE_UP_HERO_KEY = "60"; // Future Princess
const RATE_UP_WEAPON_NAME = "Liberator"; // Senjata Future Princess

// Filter database
const HEROES_3 = HEROES_DB.filter(h => h.rarity === 3);
const HEROES_2 = HEROES_DB.filter(h => h.rarity === 2);
const HEROES_1 = HEROES_DB.filter(h => h.rarity === 1);

const EXCLUSIVE_WEAPONS_5 = HEROES_DB.filter(h => h.rarity === 3 && h.weapon).map(h => ({
  name: h.weapon,
  type: h.weaponType,
  heroName: h.name,
  rarity: 5
}));

const EXCLUSIVE_WEAPONS_4 = HEROES_DB.filter(h => h.rarity === 2 && h.weapon).map(h => ({
  name: h.weapon,
  type: h.weaponType,
  heroName: h.name,
  rarity: 4
}));

// ---------- LocalStorage State ----------
const STORAGE_KEY = "gt_gacha_state_v1";

function saveState() {
  try {
    const state = { gems, mileage, crystals, totalPulls, softPityHero, softPityWeapon, inventory, currentBanner };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Gagal menyimpan state:", e);
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      gems = state.gems !== undefined ? state.gems : 10000;
      mileage = state.mileage !== undefined ? state.mileage : 0;
      crystals = state.crystals !== undefined ? state.crystals : 0;
      totalPulls = state.totalPulls !== undefined ? state.totalPulls : 0;
      softPityHero = state.softPityHero !== undefined ? state.softPityHero : 0;
      softPityWeapon = state.softPityWeapon !== undefined ? state.softPityWeapon : 0;
      inventory = state.inventory || { heroes: {}, weapons: {} };
      currentBanner = state.currentBanner || 'hero-rateup';
    }
  } catch (e) {
    console.error("Gagal memuat state:", e);
  }
}

// ---------- Helper ----------
function pilihAcak(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Mengambil URL artwork hero
function getHeroArtwork(hero) {
  return `https://www.gtales.top/assets/heroes/${hero.atr}.webp`;
}

// Mengambil URL ikon elemen
function getElementIcon(element) {
  return `https://www.gtales.top/assets/elements/${element}.svg`;
}

// Menambahkan Gems gratis
function tambahGems() {
  gems += 10000;
  updateUI();
  saveState();
  showToast("Ditambahkan +10,000 Gems!");
}

// Reset data gacha
function resetSimulator() {
  if (confirm("Apakah Anda yakin ingin mereset semua data simulasi?")) {
    gems = 10000;
    mileage = 0;
    crystals = 0;
    totalPulls = 0;
    softPityHero = 0;
    softPityWeapon = 0;
    inventory = { heroes: {}, weapons: {} };
    saveState();
    updateUI();
    showToast("Data simulasi di-reset!");
  }
}

// ---------- Logika Inti Pull Gacha ----------
function pullOne(isHeroBanner) {
  mileage += 1;
  totalPulls += 1;

  if (isHeroBanner) {
    softPityHero += 1;
    let roll = Math.random();
    let rarity = 1;

    // Cek Garansi Soft Pity
    if (softPityHero >= SOFT_PITY_MAX) {
      rarity = 3;
    } else {
      if (roll < RATE_HERO_3) rarity = 3;
      else if (roll < (RATE_HERO_3 + RATE_HERO_2)) rarity = 2;
    }

    let hero;
    let isRateUp = false;

    if (rarity === 3) {
      softPityHero = 0;
      // Banner Rate-up: 50% kesempatan mendapatkan hero rate-up
      if (currentBanner === 'hero-rateup' && Math.random() < 0.5) {
        hero = HEROES_DB.find(h => h.key === RATE_UP_HERO_KEY);
        isRateUp = true;
      }
      // Jika tidak rate-up, pilih acak hero bintang 3
      if (!hero) {
        hero = pilihAcak(HEROES_3);
      }
    } else if (rarity === 2) {
      hero = pilihAcak(HEROES_2);
    } else {
      hero = pilihAcak(HEROES_1);
    }

    // Cek Duplikat
    let isDup = false;
    let crystalAwarded = 0;
    if (inventory.heroes[hero.key]) {
      isDup = true;
      inventory.heroes[hero.key] += 1;
      crystalAwarded = hero.rarity === 3 ? 50 : (hero.rarity === 2 ? 8 : 1);
      crystals += crystalAwarded;
    } else {
      inventory.heroes[hero.key] = 1;
    }

    return {
      type: 'hero',
      item: hero,
      rarity: hero.rarity,
      isRateUp,
      isDup,
      crystalAwarded
    };

  } else {
    // Weapon Banner
    softPityWeapon += 1;
    let roll = Math.random();
    let rarity = 3; // generic/common weapon default

    if (softPityWeapon >= SOFT_PITY_MAX) {
      rarity = 5;
    } else {
      if (roll < RATE_WEAP_5) rarity = 5;
      else if (roll < (RATE_WEAP_5 + RATE_WEAP_4)) rarity = 4;
    }

    let weapon;
    let isRateUp = false;

    if (rarity === 5) {
      softPityWeapon = 0;
      if (currentBanner === 'weapon-rateup' && Math.random() < 0.33) {
        weapon = EXCLUSIVE_WEAPONS_5.find(w => w.name === RATE_UP_WEAPON_NAME);
        isRateUp = true;
      }
      if (!weapon) {
        weapon = pilihAcak(EXCLUSIVE_WEAPONS_5);
      }
    } else if (rarity === 4) {
      weapon = pilihAcak(EXCLUSIVE_WEAPONS_4);
    } else {
      weapon = pilihAcak(GENERIC_WEAPONS);
    }

    // Masukkan Inventory
    if (inventory.weapons[weapon.name]) {
      inventory.weapons[weapon.name] += 1;
    } else {
      inventory.weapons[weapon.name] = 1;
    }

    return {
      type: 'weapon',
      item: weapon,
      rarity: rarity,
      isRateUp,
      isDup: false,
      crystalAwarded: 0
    };
  }
}

// Jalankan tarikan (1x / 10x)
let currentPullResults = [];
let revealIndex = 0;

function executePull(count) {
  const cost = count === 10 ? 2700 : 300;
  if (gems < cost) {
    alert("Gems tidak cukup! Klik tombol '+ GEMS' untuk menambah Gems secara gratis.");
    return;
  }

  // Kurangi Gems
  gems -= cost;

  const isHeroBanner = currentBanner.startsWith('hero');
  currentPullResults = [];
  
  for (let i = 0; i < count; i++) {
    currentPullResults.push(pullOne(isHeroBanner));
  }

  saveState();
  updateUI();
  
  // Tampilkan Mode Reveal Box ala Guardian Tales
  startRevealFlow();
}

// ---------- Aliran Animasi Pembukaan Box ----------
function startRevealFlow() {
  revealIndex = 0;
  
  const stage = document.getElementById('stage');
  stage.innerHTML = '';
  
  // Tampilkan ringkasan box yang didapat (Brown/Gold/White box)
  const boxSummary = document.createElement('div');
  boxSummary.className = 'box-summary-grid';
  
  currentPullResults.forEach((res, index) => {
    const box = document.createElement('div');
    box.className = `gacha-box ${getBoxClass(res)}`;
    box.innerHTML = `<div class="box-inner"></div>`;
    box.onclick = () => revealItem(index);
    boxSummary.appendChild(box);
  });
  
  const revealControls = document.createElement('div');
  revealControls.className = 'reveal-controls';
  
  const skipBtn = document.createElement('button');
  skipBtn.className = 'btn';
  skipBtn.innerText = 'SKIP ALL';
  skipBtn.onclick = revealAllInstantly;
  revealControls.appendChild(skipBtn);
  
  stage.appendChild(boxSummary);
  stage.appendChild(revealControls);
  
  // Scroll to stage
  document.querySelector('.stage').scrollIntoView({ behavior: 'smooth' });
}

function getBoxClass(res) {
  if (res.type === 'hero') {
    return res.rarity === 3 ? 'white-box' : (res.rarity === 2 ? 'gold-box' : 'brown-box');
  } else {
    return res.rarity === 5 ? 'white-box' : (res.rarity === 4 ? 'gold-box' : 'brown-box');
  }
}

function revealItem(index) {
  const res = currentPullResults[index];
  const stage = document.getElementById('stage');
  stage.innerHTML = '';
  
  const card = document.createElement('div');
  card.className = `card reveal-animation ${res.rarity === 3 || res.rarity === 5 ? 'legendary-glow' : ''}`;
  
  if (res.type === 'hero') {
    const hero = res.item;
    const stars = "★".repeat(hero.rarity);
    const elementText = hero.element.toUpperCase();
    
    card.innerHTML = `
      <div class="card-element-bg" style="background-image: url('${getElementIcon(hero.element)}'); opacity: 0.1;"></div>
      <img class="sprite" src="${getHeroArtwork(hero)}" onerror="this.src='https://www.gtales.top/assets/icons/nav/heroes.svg'" alt="${hero.name}">
      ${res.isDup ? `<div class="shiny-badge">DUPLIKAT (+&nbsp;${res.crystalAwarded} HC)</div>` : ''}
      ${res.isRateUp ? `<div class="rateup-badge">✨ RATE UP</div>` : ''}
      <div class="hero-name">${hero.name}</div>
      <div class="stars">${stars}</div>
      <div class="badge-row">
        <span class="element-badge ${hero.element}">${elementText}</span>
        <span class="role-badge">${hero.role.toUpperCase()}</span>
      </div>
      <div class="signature-weapon">Weapon: ${hero.weapon || 'None'}</div>
    `;
  } else {
    // Weapon
    const weapon = res.item;
    const isEx = weapon.rarity === 5 || weapon.rarity === 4;
    const stars = "★".repeat(weapon.rarity);
    
    card.innerHTML = `
      <div class="card-element-bg" style="background-image: url('https://www.gtales.top/assets/icons/switch-weapon.svg'); opacity: 0.1;"></div>
      <div class="weapon-icon-container">
        <div class="large-weap-icon">⚔️</div>
      </div>
      ${res.isRateUp ? `<div class="rateup-badge">✨ RATE UP</div>` : ''}
      <div class="hero-name">${weapon.name}</div>
      <div class="stars">${stars}</div>
      <div class="badge-row">
        <span class="role-badge">${weapon.type.toUpperCase()}</span>
        ${isEx ? `<span class="ex-badge">EXCLUSIVE</span>` : ''}
      </div>
      <div class="signature-weapon">${weapon.heroName ? `Owner: ${weapon.heroName}` : 'Generic Weapon'}</div>
    `;
  }
  
  const controlDiv = document.createElement('div');
  controlDiv.className = 'reveal-controls';
  
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn gold';
  nextBtn.innerText = index < currentPullResults.length - 1 ? 'REVEAL NEXT' : 'CLOSE';
  nextBtn.onclick = () => {
    if (index < currentPullResults.length - 1) {
      revealItem(index + 1);
    } else {
      closeReveal();
    }
  };
  
  controlDiv.appendChild(nextBtn);
  stage.appendChild(card);
  stage.appendChild(controlDiv);
}

function revealAllInstantly() {
  const stage = document.getElementById('stage');
  stage.innerHTML = '';
  
  const grid = document.createElement('div');
  grid.className = 'reveal-grid-result';
  
  currentPullResults.forEach(res => {
    const item = document.createElement('div');
    item.className = `reveal-grid-item ${getBoxClass(res)}`;
    
    if (res.type === 'hero') {
      const hero = res.item;
      item.innerHTML = `
        <img src="${getHeroArtwork(hero)}" onerror="this.src='https://www.gtales.top/assets/icons/nav/heroes.svg'" alt="">
        <div class="lbl-name">${hero.name}</div>
        <div class="lbl-rarity">${"★".repeat(hero.rarity)}</div>
        ${res.isDup ? `<div class="lbl-dup">+${res.crystalAwarded} HC</div>` : ''}
      `;
    } else {
      const weapon = res.item;
      item.innerHTML = `
        <div class="grid-weap-icon">⚔️</div>
        <div class="lbl-name">${weapon.name}</div>
        <div class="lbl-rarity">${"★".repeat(weapon.rarity)}</div>
      `;
    }
    grid.appendChild(item);
  });
  
  const controlDiv = document.createElement('div');
  controlDiv.className = 'reveal-controls';
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn gold';
  closeBtn.innerText = 'OK';
  closeBtn.onclick = closeReveal;
  controlDiv.appendChild(closeBtn);
  
  stage.appendChild(grid);
  stage.appendChild(controlDiv);
}

function closeReveal() {
  const stage = document.getElementById('stage');
  stage.innerHTML = `
    <div class="placeholder" id="placeholder">
      <div class="drone-container">
        <div class="gacha-drone"></div>
      </div>
      <div class="ph-text">Tekan PULL untuk memulai gacha</div>
    </div>
  `;
  updateHistoryUI();
}

// ---------- Mileage Shop ----------
function redeemMileage(key, type) {
  if (mileage < 300) {
    alert("Mileage Tickets tidak cukup! Butuh 300 tiket.");
    return;
  }
  
  mileage -= 300;
  
  if (type === 'hero') {
    const hero = HEROES_DB.find(h => h.key === key);
    if (inventory.heroes[hero.key]) {
      inventory.heroes[hero.key] += 1;
      crystals += 50; // duplicate unique gives 50 crystals
      showToast(`Membeli ${hero.name} (Duplikat! Mendapatkan +50 Hero Crystals)`);
    } else {
      inventory.heroes[hero.key] = 1;
      showToast(`Membeli ${hero.name} Baru!`);
    }
  } else {
    // weapon
    const weapon = EXCLUSIVE_WEAPONS_5.find(w => w.name === key);
    if (inventory.weapons[weapon.name]) {
      inventory.weapons[weapon.name] += 1;
    } else {
      inventory.weapons[weapon.name] = 1;
    }
    showToast(`Membeli ${weapon.name} Baru!`);
  }
  
  saveState();
  updateUI();
  renderShop();
}

// ---------- Toast Notification ----------
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.hidden = false;
  toast.classList.add('fade-in');
  setTimeout(() => {
    toast.classList.remove('fade-in');
    toast.hidden = true;
  }, 3000);
}

// ---------- Render / Update UI ----------
function updateUI() {
  // Stats
  document.getElementById('gemsCount').innerText = Number(gems).toLocaleString();
  document.getElementById('mileageCount').innerText = mileage;
  document.getElementById('crystalsCount').innerText = crystals;
  document.getElementById('totalCount').innerText = totalPulls;
  
  // Pity
  const isHeroBanner = currentBanner.startsWith('hero');
  const pityCount = isHeroBanner ? softPityHero : softPityWeapon;
  document.getElementById('pityText').innerText = `${pityCount} / ${SOFT_PITY_MAX}`;
  document.getElementById('pityFill').style.width = `${(pityCount / SOFT_PITY_MAX) * 100}%`;
  document.getElementById('pityLabel').innerText = isHeroBanner ? "Pity Hero Bintang 3" : "Pity Senjata Eksklusif 5★";

  // Banner select
  const bannerSelect = document.getElementById('bannerSelect');
  if (bannerSelect) {
    bannerSelect.value = currentBanner;
  }
  
  // Update banner display text
  const bannerTitle = document.getElementById('bannerTitle');
  const bannerRates = document.getElementById('bannerRates');
  
  if (currentBanner === 'hero-rateup') {
    bannerTitle.innerText = "RATE UP: Future Princess";
    bannerRates.innerText = "Peluang Future Princess: 1.375% | Bintang 3 Lain: 1.375%";
  } else if (currentBanner === 'hero-normal') {
    bannerTitle.innerText = "Hero Summon Normal";
    bannerRates.innerText = "Bintang 3 (Unique): 2.75% | Bintang 2 (Rare): 19%";
  } else if (currentBanner === 'weapon-rateup') {
    bannerTitle.innerText = "RATE UP: Liberator";
    bannerRates.innerText = "Peluang Liberator: 1.00% | Eksklusif 5★ Lain: 2.00%";
  } else if (currentBanner === 'weapon-normal') {
    bannerTitle.innerText = "Weapon Summon Normal";
    bannerRates.innerText = "Senjata Eksklusif 5★: 3.00% | Senjata Legend 4★: 9.00%";
  }
  
  renderInventory();
}

function updateHistoryUI() {
  const historyDiv = document.getElementById('history');
  historyDiv.innerHTML = '';
  
  if (currentPullResults.length === 0) {
    historyDiv.innerHTML = '<div class="empty-hist">Belum ada riwayat tarikan saat ini.</div>';
    return;
  }
  
  currentPullResults.forEach(res => {
    const row = document.createElement('div');
    row.className = `hist-row ${res.rarity === 3 || res.rarity === 5 ? 'legendary' : ''}`;
    
    if (res.type === 'hero') {
      row.innerHTML = `
        <span class="hist-name">${res.item.name}</span>
        <span class="hist-rarity">${"★".repeat(res.rarity)} Hero</span>
        ${res.isDup ? `<span class="hist-dup">DUPLIKAT (+${res.crystalAwarded} HC)</span>` : '<span class="hist-new">BARU</span>'}
      `;
    } else {
      row.innerHTML = `
        <span class="hist-name">${res.item.name}</span>
        <span class="hist-rarity">${"★".repeat(res.rarity)} Weapon</span>
        <span class="hist-new">BARU</span>
      `;
    }
    historyDiv.appendChild(row);
  });
}

function renderInventory() {
  const heroGrid = document.getElementById('heroGrid');
  const weaponGrid = document.getElementById('weaponGrid');
  
  heroGrid.innerHTML = '';
  weaponGrid.innerHTML = '';
  
  // Render Heroes
  const collectedHeroKeys = Object.keys(inventory.heroes);
  const collectedHeroes = HEROES_DB.filter(h => collectedHeroKeys.includes(h.key))
    .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
    
  if (collectedHeroes.length === 0) {
    heroGrid.innerHTML = '<div class="empty-inventory">Belum ada hero yang terkumpul. Mulailah gacha! 🎒</div>';
  } else {
    collectedHeroes.forEach(hero => {
      const count = inventory.heroes[hero.key];
      const cell = document.createElement('div');
      cell.className = `inventory-cell ${hero.rarity === 3 ? 'rarity-3' : (hero.rarity === 2 ? 'rarity-2' : 'rarity-1')}`;
      cell.onclick = () => showHeroDetail(hero);
      
      cell.innerHTML = `
        <span class="cell-count">x${count}</span>
        <img class="cell-portrait" src="${getHeroArtwork(hero)}" onerror="this.src='https://www.gtales.top/assets/icons/nav/heroes.svg'" alt="">
        <div class="cell-name">${hero.name}</div>
        <div class="cell-stars">${"★".repeat(hero.rarity)}</div>
      `;
      heroGrid.appendChild(cell);
    });
  }
  
  // Render Weapons
  const collectedWeaponNames = Object.keys(inventory.weapons);
  if (collectedWeaponNames.length === 0) {
    weaponGrid.innerHTML = '<div class="empty-inventory">Belum ada senjata yang terkumpul. Mulailah gacha! ⚔️</div>';
  } else {
    collectedWeaponNames.forEach(wName => {
      const count = inventory.weapons[wName];
      // Cari apakah senjata eksklusif (ada di DB)
      const details5 = EXCLUSIVE_WEAPONS_5.find(w => w.name === wName);
      const details4 = EXCLUSIVE_WEAPONS_4.find(w => w.name === wName);
      const isEx = details5 || details4;
      const rarity = details5 ? 5 : (details4 ? 4 : 3);
      
      const cell = document.createElement('div');
      cell.className = `inventory-cell weapon-cell ${rarity === 5 ? 'rarity-3' : (rarity === 4 ? 'rarity-2' : 'rarity-1')}`;
      
      cell.innerHTML = `
        <span class="cell-count">x${count}</span>
        <div class="cell-weapon-icon">⚔️</div>
        <div class="cell-name">${wName}</div>
        <div class="cell-stars">${"★".repeat(rarity)}</div>
        ${isEx ? '<span class="cell-ex-tag">EX</span>' : ''}
      `;
      weaponGrid.appendChild(cell);
    });
  }
}

function showHeroDetail(hero) {
  const modal = document.getElementById('detailModal');
  if (!modal) return;
  
  const stars = "★".repeat(hero.rarity);
  const elementText = hero.element.toUpperCase();
  
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-card ${hero.rarity === 3 ? 'legendary-glow' : ''}">
      <span class="close-modal-btn" onclick="closeHeroDetail()">&times;</span>
      <div class="modal-hero-header">
        <img class="modal-portrait" src="${getHeroArtwork(hero)}" onerror="this.src='https://www.gtales.top/assets/icons/nav/heroes.svg'" alt="">
        <div>
          <h2>${hero.name}</h2>
          <div class="stars">${stars}</div>
          <div style="margin-top: 8px;">
            <span class="element-badge ${hero.element}">${elementText}</span>
            <span class="role-badge">${hero.role.toUpperCase()}</span>
          </div>
        </div>
      </div>
      <div class="modal-hero-body">
        <p><strong>Signature Weapon:</strong> ${hero.weapon || 'None'}</p>
        <p><strong>Weapon Type:</strong> ${hero.weaponType ? hero.weaponType.toUpperCase() : 'None'}</p>
        <div class="stat-section">
          <h4>Base Statistics</h4>
          <div class="detail-stat-row"><span>Rarity Base:</span> <span>${hero.rarity} Star</span></div>
          <div class="detail-stat-row"><span>Attribute:</span> <span style="text-transform: capitalize;">${hero.element}</span></div>
          <div class="detail-stat-row"><span>Role Class:</span> <span style="text-transform: capitalize;">${hero.role}</span></div>
        </div>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
}

function closeHeroDetail() {
  const modal = document.getElementById('detailModal');
  if (modal) modal.style.display = 'none';
}

function renderShop() {
  const shopGrid = document.getElementById('shopGrid');
  shopGrid.innerHTML = '';
  
  // Tampilkan tab tiket saat ini
  document.getElementById('shopTickets').innerText = mileage;
  
  // Tampilkan daftar hero bintang 3 yang bisa dibeli
  HEROES_3.sort((a, b) => a.name.localeCompare(b.name)).forEach(hero => {
    // Card Hero
    const card = document.createElement('div');
    card.className = 'shop-card';
    card.innerHTML = `
      <img class="shop-item-icon" src="${getHeroArtwork(hero)}" onerror="this.src='https://www.gtales.top/assets/icons/nav/heroes.svg'" alt="">
      <div class="shop-item-name">${hero.name}</div>
      <div class="shop-item-rarity">3★ Unique Hero</div>
      <button class="btn shop-btn" ${mileage < 300 ? 'disabled' : ''} onclick="redeemMileage('${hero.key}', 'hero')">
        🎫 300 Redeem
      </button>
    `;
    shopGrid.appendChild(card);
    
    // Card Weapon (jika punya senjata eksklusif)
    if (hero.weapon) {
      const weapCard = document.createElement('div');
      weapCard.className = 'shop-card';
      weapCard.innerHTML = `
        <div class="shop-weapon-icon">⚔️</div>
        <div class="shop-item-name">${hero.weapon}</div>
        <div class="shop-item-rarity">5★ EX (${hero.name})</div>
        <button class="btn shop-btn" ${mileage < 300 ? 'disabled' : ''} onclick="redeemMileage('${hero.weapon}', 'weapon')">
          🎫 300 Redeem
        </button>
      `;
      shopGrid.appendChild(weapCard);
    }
  });
}

// ---------- Tab Navigation ----------
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const panels = document.querySelectorAll('.tab-panel');
      panels.forEach(p => p.hidden = true);
      
      const target = tab.getAttribute('data-tab');
      document.getElementById('panel-' + target).hidden = false;
      
      if (target === 'shop') {
        renderShop();
      }
    };
  });
}

// ---------- Inisialisasi ----------
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  setupTabs();
  
  // Event listeners untuk banner select
  const bannerSelect = document.getElementById('bannerSelect');
  if (bannerSelect) {
    bannerSelect.onchange = (e) => {
      currentBanner = e.target.value;
      saveState();
      updateUI();
    };
  }
  
  // Event pull buttons
  document.getElementById('tarik1').onclick = () => executePull(1);
  document.getElementById('tarik10').onclick = () => executePull(10);
  document.getElementById('tambahGemsBtn').onclick = tambahGems;
  document.getElementById('resetBtn').onclick = resetSimulator;
  
  updateUI();
  closeReveal(); // set placeholder awal
});

window.onclick = function(event) {
  const modal = document.getElementById('detailModal');
  if (event.target === modal) {
    closeHeroDetail();
  }
};
