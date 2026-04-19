// Mapa code (hero-sms) → domínio oficial.
// Usado pra puxar favicon oficial via Google Favicons sz=128.
// Quando code não está no mapa, deriva do nome (1ª palavra → .com).

const MAP = {
  // Mensagem / Social
  tg: 'telegram.org', wa: 'whatsapp.com', wb: 'wechat.com', vi: 'viber.com',
  im: 'imo.im', me: 'line.me', sg: 'signal.org', bw: 'signal.org',
  fb: 'facebook.com', ig: 'instagram.com', tw: 'twitter.com', tn: 'linkedin.com',
  ds: 'discord.com', sn: 'olx.com.br', kt: 'kakao.com', qq: 'qq.com',
  vk: 'vk.com', ok: 'ok.ru', kf: 'weibo.com', zs: 'bilibili.com',
  hb: 'twitch.tv', fu: 'snapchat.com', lf: 'tiktok.com', bnl: 'reddit.com',
  rc: 'skype.com', et: 'clubhouse.com', xs: 'groupme.com', xr: 'tango.me',
  bl: 'bigo.tv', mx: 'soulapp.cn', vy: 'meta.com', ada: 'truthsocial.com',
  qy: 'zhihu.com', ww: 'bipmessenger.com', boh: 'yophone.com',
  bsu: 'dingtone.com', tl: 'truecaller.com', aup: 'botim.me',
  asq: 'warpcast.com', cau: 'erome.com', azi: 'thel.com',

  // Big tech / Cloud
  go: 'google.com', gf: 'voice.google.com', ccu: 'chat.google.com',
  mm: 'microsoft.com', wx: 'apple.com', am: 'amazon.com', mb: 'yahoo.com',
  pm: 'aol.com', dr: 'openai.com', acz: 'claude.ai', ayz: 'kimi.com',
  bod: 'genspark.ai', bwv: 'manus.im', byp: 'kaito.ai', bny: 'suno.com',
  byh: 'adobe.com', amb: 'vercel.com', ano: 'shopify.com', bbl: 'autodesk.com',
  ex: 'linode.com', bwa: 'hostinger.com', ee: 'twilio.com', dp: 'proton.me',
  abk: 'gmx.com', abo: 'web.de', asj: 't-online.de', abh: 'uolhost.uol.com.br',
  ael: 'cloud.digitalocean.com', aux: 'lightning.ai', ark: 'studiolab.sagemaker.aws',
  zh: 'zoho.com', aiz: 'brevo.com', bpt: 'serpapi.com', bqi: 'datanyze.com',
  axn: 'fastmoss.com', aav: 'alchemy.com', btd: 'volcengine.com',
  bmd: 'voovmeeting.com', blr: 'docusign.com', bls: 'wetv.vip',
  apg: 'damai.cn', asb: 'yuewen.com', bix: 'hotel101.com',
  aaq: 'netease.com', li: 'baidu.com', ya: 'yandex.com',
  ma: 'mail.ru', ue: 'onet.pl', adu: 'seznam.cz', hu: 'ukr.net',
  nv: 'naver.com', co: 'rediffmail.com',

  // E-commerce
  hw: 'alipay.com', hx: 'aliexpress.com', dh: 'ebay.com', dl: 'lazada.com',
  ka: 'shopee.com', xd: 'tokopedia.com', za: 'jd.com', zp: 'pinduoduo.com',
  qf: 'xiaohongshu.com', sg2: 'ozon.ru', sg: 'ozon.ru', uu: 'wildberries.ru',
  pr: 'trendyol.com', ep: 'temu.com', aez: 'shein.com',
  fk: 'blibli.com', wr: 'walmart.com', ew: 'nike.com',
  oz: 'poshmark.com', kc: 'vinted.com', dg: 'mercari.com', awv: 'wallapop.com',
  bex: 'whatnot.com', bqp: 'zara.com', baq: 'redbubble.com',
  agd: 'grailed.com', arf: 'enjoei.com.br', cm: 'prom.ua', km: 'rozetka.com.ua',
  yn: 'allegro.pl', cb: 'bazos.cz', do: 'leboncoin.fr', lc: 'subito.it',
  aop: 'kleinanzeigen.de', adt: 'willhaben.at', amz: 'immobilienscout24.de',
  ib: 'immowelt.de', ber: 'gumtree.com', bdo: 'adamodal.com',
  apd: '2dehands.be', blx: '2ememain.be', agj: 'marktplaats.nl',
  bkd: 'sahibinden.com', wc: 'craigslist.org', zm: 'offerup.com',
  ef: 'nextdoor.com', kk: 'idealista.com', bzo: 'seloger.com',
  bsw: 'milanuncios.com', afs: 'privalia.com', arp: 'continente.pt',
  apf: 'carrefour.com', anh: 'cadbury.co.uk', abb: 'coca-cola.com',
  aey: 'next.co.uk', bmd2: 'voov.cn', cak: 'bazaraki.com', cbs: 'lalafo.kg',
  bhj: 'jofogas.hu', bgn: 'veeka.de', byw: 'annoncelight.dk',
  bqm: 'beebs.com', bqo: 'caffenero.com', bom: 'box.com',
  ip: 'burgerking.com', ry: 'mcdonalds.com', fz: 'kfc.com',
  awg: 'natura.com.br', akz: 'panvel.com', anw: 'natura.com.br',

  // Pagamentos / Bancos / Cripto
  ts: 'paypal.com', yy: 'venmo.com', re: 'coinbase.com', mt: 'steampowered.com',
  aon: 'binance.com', abn: 'bybit.com', aor: 'okx.com', bii: 'mexc.com',
  ahx: 'bitrue.com', anj: 'gemini.com', bgj: 'moonpay.com', aoi: 'cryptonow.com',
  ti: 'crypto.com', ht: 'bitso.com', blz: 'minipay.io', bwe: 'immutable.com',
  bqb: 'weex.com', bo: 'wise.com', ij: 'revolut.com', aom: 'monzo.com',
  ahe: 'bunq.com', py: 'monese.com', aiv: 'remitly.com', alo: 'profee.com',
  qx: 'worldremit.com', tr: 'paysend.com', aoe: 'sendwave.com', brr: 'lemfi.com',
  bjp: 'riamoneytransfer.com', cbb: 'keepcalling.com', nc: 'payoneer.com',
  jq: 'paysafecard.com', aqt: 'skrill.com', aok: 'neteller.com',
  afz: 'klarna.com', bli: 'scalapay.com', bow: 'affirm.com', bgv: 'clearpay.com',
  bbg: 'squareup.com', avj: 'sumup.com', xu: 'recargapay.com.br',
  abc: 'taptapsend.com', abg: 'pagseguro.uol.com.br', ev: 'picpay.com',
  aaa: 'nubank.com.br', aff: 'c6bank.com.br', ann: 'bradesco.com.br',
  btn: 'itau.com.br', sa: 'agibank.com.br', anx: 'infinitepay.io',
  agh: 'getnet.com.br', bxj: 'queroquero.com.br', bnt: 'treasury.com',
  lj: 'santander.com', apr: 'capitalone.com', bbq: 'chime.com', qo: 'moneylion.com',
  bru: 'mypos.com', bso: 'paywell.com', alb: 'guicheweb.com.br', cj: 'dotz.com.br',
  bjz: 'jeevansathi.com', aoh: 'yoomoney.ru', atu: 'sber.ru', my: 'caixa.gov.br',

  // Carona / Mobilidade
  ub: 'uber.com', tu: 'lyft.com', tx: 'bolt.eu', xk: 'didiglobal.com',
  ni: 'gojek.com', jg: 'grab.com', ki: '99app.com', rl: 'indrive.com',
  ac: 'doordash.com', zk: 'deliveroo.co.uk', em: 'ze.delivery',
  rr: 'wolt.com', cp: 'uklon.com.ua', ls: 'careem.com', ahl: 'taximaxim.com',
  vr: 'motorku-x.com', adp: 'cabify.com', te: 'efood.gr', yi: 'yemeksepeti.com',
  fh: 'lalamove.com', ly: 'olacabs.com', ul: 'getir.com', zb: 'free-now.com',
  uv: 'binbin.io', ahi: 'daki.com.br', bra: 'tngdigital.com.my',
  ahi2: 'daki.com.br', ais: 'didi-food.com', tv: 'goflink.com', ua: 'blablacar.com',
  qj: 'whoosh.bike', akr: 'voi.com', bfr: 'ridedott.com', bwf: 'mygo.com',
  yx: 'jtexpress.com', ms: 'novaposhta.ua',

  // Comida
  pd: 'ifood.com.br', nz: 'foodpanda.com', abe: 'foodora.com',
  ani: 'talabat.com', ajn: 'gopuff.com', sr: 'starbucks.com',
  als: 'greggs.com', bwx: 'chagee.com', asy: 'forecoffee.com',
  ang: 'tomorocoffee.com', avb: 'tealive.my', aik: 'zuscoffee.com',
  ju: 'indomaret.co.id', bgt: 'alfamidi.co.id', bn: 'alfagift.com',
  aws: '7-eleven.com', cam: 'ele.me', auh: 'keeta.com',
  cct: 'thefactory.com', aeu: 'thefork.com', are: 'seated.com',

  // Dating
  oi: 'tinder.com', mo: 'bumble.com', vz: 'hinge.co', df: 'happn.com',
  yw: 'grindr.com', vm: 'okcupid.com', qv: 'badoo.com', mv: 'fruitz.app',
  pf: 'pof.com', ws: 'feeld.co', akp: 'weareher.com', wh: 'tantanapp.com',
  bdh: 'single.dk', alm: 'muzz.com', bvi: 'salams.app', bhr: 'dilmil.co',
  axr: 'match.com', aub: 'smitten.com', aje: 'cupidmedia.com',
  ayb: 'asiandating.com', bbk: 'filipinocupid.com', bbu: 'internationalcupid.com',
  ama: 'wooplus.com', bpc: 'lovoo.com', oj: 'loverly.com', pu: 'justdating.com',
  ir: 'chispa.app', xx: 'joyrideapp.com', fd: 'mamba.ru',
  rt: 'hily.com', akd: 'feels.dating', bdg: 'hud.app', btr: 'duet.com',
  bqn: 'upward.com', gm: 'mocospace.com',

  // Streaming / Mídia
  nf: 'netflix.com', alj: 'spotify.com', fv: 'vidio.com', vp: 'kwai.com',

  // Games
  bz: 'blizzard.com', sw: 'plaync.com', alg: 'ankama.com', ane: 'supercell.com',
  blm: 'epicgames.com', acm: 'razer.com', aiw: 'roblox.com', ahb: 'ubisoft.com',
  awz: 'playtime.com', uz: 'offgamers.com', uf: 'eneba.com',
  ah: 'escapefromtarkov.com', aer: 'playerauctions.com', ng: 'funpay.com',
  apq: 'wepoker.com', axt: 'gnjoy.com', zy: 'nttgame.com',
  bai: 'snkrdunk.com', ban: 'bonuslink.com.my', ars: 'bingoplus.com',
  agl: 'betano.com', boo: 'casinoplus.com', adc: 'playojo.com',
  bwu: 'skybet.com', ie: 'bet365.com', bnl2: 'reddit.com',
  azz: 'crystalbet.com', vd: 'betfair.com', cw: 'paddypower.com',
  bos: 'casino.pt', bmj: 'betflag.it', bqe: 'lottomatica.it',
  bqy: 'snai.it', bmi: 'sisal.it', ej: 'mrq.com', ft: 'bookmakers.com',
  bkn: 'betlive.com', bfo: 'msport.com', blh: 'winner.com',
  pc: 'pokerstars.com',

  // Trabalho / Anúncios
  cn: 'fiverr.com', abq: 'upwork.com', gq: 'freelancer.com',
  brk: 'indeed.com', tn2: 'linkedin.com', agg: 'oneforma.com',
  amw: 'tise.com', auz: 'outlier.ai', anl: 'attapoll.app',
  aig: 'fivesurveys.com', bpi: 'askable.com', aiq: 'primeopinion.com',
  bkz: 'rewardy.com', auc: 'totalpass.com.br', app: 'classpass.com',
  box: 'thumbtack.com', agv: 'donedeal.ie', bav: 'leolist.cc',
  bba: 'switchup.org', api2: 'kktix.com',

  // Compras / Misc
  cq: 'mercadolivre.com.br', sn2: 'olx.com', gp: 'ticketmaster.com',
  hp: 'meeshosupply.com', adi: 'zepto.com', ace: 'tatadigital.com',
  bxg: 'bat.com', il: 'iqos.com', afk: 'chevron.com', bob: 'shell.com',
  bhb: 'wuling.id', bko: 'visionplus.id', aoq: 'jbhifi.com.au',
  aoo: 'flypgs.com', bol: 'telus.com', pb: 'sky.com', tf: 'noon.com',
  tc: 'rumbler.com', gx: 'hepsiburada.com', fs: 'sikayetvar.com',
  bfg: 'emag.ro', kv: 'rush.com', ah2: 'tarkov.com', ait: 'feetfinder.com',
  bni: 'pets4homes.co.uk', si: 'citaprevia.es',
  ais2: 'didi-food.com', bsm: 'ahlanonline.com', bsy: 'airmiles.ca',
  bnu: 'qpon.com', bre: 'lemana.ru', brg: 'letgo.com', bhj2: 'jofogas.hu',
  cba: 'enilive.com', kl: 'kolesa.kz', bfv: 'chocofamily.kz',
  bcg: '2gis.ru', btx: 'amap.com', bvs: 'vchasno.ua', vg: 'shellbox.com.br',

  // Indonésia bancos/super-apps
  bc: 'gcash.com', xh: 'ovo.id', fr: 'dana.id', tm: 'akulaku.com',
  hc: 'momo.vn', aem: 'astrapay.com', akl: 'doku.com', aly: 'bebeclub.com',
  asp: 'phonepe.com', aly2: 'bebeclub.com', bnl3: 'reddit.com',
  bme: 'im3.id', myim3: 'im3.id', aoy: 'pln.co.id', nh: 'allobank.com',
  aka: 'linkaja.com', bbm: 'truemoney.com', byf: 'seabank.co.id',
  blt: 'indopaket.com', bcx: 'bantusaku.id', bih: 'indosaku.id',
  ayo: '360kredi.com', axj: 'fifgroup.com', bdp: 'kredito.com',
  bgl: 'pepsi.com', bzk: 'amaze.com', axs: 'ais.co.th',

  // Outros bancos / fintechs
  abu: 'bpjsketenagakerjaan.go.id', bgl2: 'pepsi.com', adp2: 'cabify.com',
  bru2: 'mypos.com', bbf: 'neosurf.com', bbr: 'wallethub.com',
  bsv: 'amartha.com', amv: 'avantcredit.com',

  // Verificação / Visa / Gov
  afp: 'vfsglobal.com', afe: 'gov.br', aoz: 'reclameaqui.com.br',
  axm: 'naomeperturbe.com.br', anq: 'hitnspin.com',

  // Saúde / Beleza
  qh: 'oriflame.com', atl: 'watsons.com.my',

  // Misc 2
  bfa: 'webmotors.com.br', ccl: 'cruzeiro.com.br', agb: 'smiles.com.br',
  agm: 'cmbchina.com', ari: 'ring4.com', asf: 'textfree.com', atp: 'vonage.com',
  atn: 'fawry.com', atr: 'ride.com', awq: 'atlasearth.com', awg2: 'natura.com.br',
  bbj: 'onepay.vn', bgl3: 'pepsi.com', bkk: 'poparide.com', bp: 'gofundme.com',
  bqh: 'pedirgas.com', bxv: 'paper.com', bxw: 'credinex.com', cak2: 'bazaraki.com',
  yl: 'yallaplay.com', tg2: 'telegram.org',
};

function deriveDomain(name) {
  if (!name) return null;
  // Pega 1ª "palavra real" alfanumérica
  const clean = String(name).trim()
    .replace(/[\u00A0]/g, ' ')
    .split(/[\s,/+|·•\-—–]/)[0]
    .replace(/[^\w]/g, '')
    .toLowerCase();
  if (!clean || clean.length < 2) return null;
  return `${clean}.com`;
}

function iconUrlFor(code, name) {
  const domain = MAP[code] || deriveDomain(name);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

module.exports = { iconUrlFor, MAP, deriveDomain };
