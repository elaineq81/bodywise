"use client";

import { useEffect, useMemo, useState } from "react";

type Sex = "Female" | "Male" | "Prefer not to say";
type Level = "Beginner" | "Intermediate" | "Advanced";
type Readiness = "Gentle" | "Steady" | "Strong";
type Goal = "Strength" | "Skills" | "Mobility";
type Equipment = "None" | "Bands" | "Pull-up bar";
type View = "Today" | "Skills" | "Progress";
type Move = { name:string; focus:string; base:number; pose:string; cue:string; detail:string; easier:string; balance?:boolean };

const moves: Move[] = [
  { name:"Incline push-up", focus:"Chest · arms", base:35, pose:"push", cue:"Body in one long line", detail:"Hands just wider than shoulders. Lower with control, then press the surface away.", easier:"Use a higher surface" },
  { name:"Bodyweight squat", focus:"Legs · hips", base:40, pose:"squat", cue:"Knees track over toes", detail:"Sit your hips back and down. Keep your whole foot grounded and chest comfortably tall.", easier:"Squat to a chair", balance:true },
  { name:"Forearm plank", focus:"Core · shoulders", base:30, pose:"plank", cue:"Brace, breathe, stay long", detail:"Stack elbows under shoulders. Squeeze glutes gently and keep your neck neutral.", easier:"Lower both knees" },
  { name:"Glute bridge", focus:"Glutes · hamstrings", base:40, pose:"bridge", cue:"Lift from the hips", detail:"Press through your heels. Pause at the top without arching your lower back.", easier:"Reduce the lift height" },
  { name:"Dead bug", focus:"Core control", base:35, pose:"deadbug", cue:"Lower back stays heavy", detail:"Move the opposite arm and leg slowly. Exhale as they reach away from your centre.", easier:"Move one limb at a time" },
  { name:"Supported balance", focus:"Balance · posture", base:30, pose:"balance", cue:"Stand tall, eyes forward", detail:"Keep one hand near a wall or chair. Shift your weight slowly and stay within a steady range.", easier:"Keep both toes down", balance:true },
];

const ageOptions=["13–17","18–29","30–44","45–59","60+"];
const readinessFactor:Record<Readiness,number>={Gentle:.82,Steady:1,Strong:1.1};
const levelFactor:Record<Level,number>={Beginner:.82,Intermediate:1,Advanced:1.18};
const ageFactor:Record<string,number>={"13–17":.88,"18–29":1,"30–44":.97,"45–59":.9,"60+":.78};

function workTime(base:number, age:string, level:Level, readiness:Readiness, feedback:number){
  return Math.max(20,Math.round(base*ageFactor[age]*levelFactor[level]*readinessFactor[readiness]*(1+feedback*.05)/5)*5);
}

function Figure({pose,small=false}:{pose:string;small?:boolean}){
  return <div className={`figure ${pose} ${small?"small":""}`} aria-hidden="true"><i className="head"/><i className="torso"/><i className="limb arm-a"/><i className="limb arm-b"/><i className="limb leg-a"/><i className="limb leg-b"/><i className="ground"/></div>;
}

export default function Home(){
  const[age,setAge]=useState("30–44"),[sex,setSex]=useState<Sex>("Female"),[level,setLevel]=useState<Level>("Beginner");
  const[goal,setGoal]=useState<Goal>("Strength"),[equipment,setEquipment]=useState<Equipment>("None"),[readiness,setReadiness]=useState<Readiness>("Steady");
  const[view,setView]=useState<View>("Today"),[profile,setProfile]=useState(false),[session,setSession]=useState(false),[running,setRunning]=useState(false);
  const[active,setActive]=useState(0),[left,setLeft]=useState(0),[feedback,setFeedback]=useState(0),[finish,setFinish]=useState(false),[alternate,setAlternate]=useState(false);

  useEffect(()=>{try{const saved=localStorage.getItem("bodywise-profile");if(saved){const p=JSON.parse(saved);setAge(p.age??"30–44");setSex(p.sex??"Female");setLevel(p.level??"Beginner");setGoal(p.goal??"Strength");setEquipment(p.equipment??"None");setFeedback(p.feedback??0)}}catch{}},[]);
  const plan=useMemo(()=>moves.map(x=>({...x,seconds:workTime(x.base,age,level,readiness,feedback)})),[age,level,readiness,feedback]);
  const minutes=Math.round((plan.reduce((n,x)=>n+x.seconds,0)*3+360)/60),current=plan[active],timerProgress=Math.max(0,(current.seconds-left)/current.seconds*100);
  useEffect(()=>{if(!running||left<=0)return;const id=window.setInterval(()=>setLeft(v=>v-1),1000);return()=>clearInterval(id)},[running,left]);
  useEffect(()=>{if(left===0&&session)setRunning(false)},[left,session]);

  function saveProfile(){localStorage.setItem("bodywise-profile",JSON.stringify({age,sex,level,goal,equipment,feedback}));setProfile(false)}
  function start(){setActive(0);setLeft(plan[0].seconds);setRunning(true);setFinish(false);setAlternate(false);setSession(true)}
  function next(){if(active===plan.length-1){setRunning(false);setSession(false);setFinish(true)}else{setActive(v=>v+1);setLeft(plan[active+1].seconds);setAlternate(false);setRunning(true)}}
  function rate(value:number){const updated=Math.max(-2,Math.min(2,feedback+value));setFeedback(updated);localStorage.setItem("bodywise-profile",JSON.stringify({age,sex,level,goal,equipment,feedback:updated}));setFinish(false)}

  return <main className="app-shell">
    <header className="topbar"><button className="brand" onClick={()=>setView("Today")} aria-label="Bodywise home"><b>B</b><span>BODYWISE</span></button><button className="profile-pill" onClick={()=>setProfile(true)} aria-label="Open training profile"><span>{age}</span><b>{sex==="Female"?"F":sex==="Male"?"M":"—"}</b></button></header>

    {view==="Today"&&<>
      <section className="greeting"><div><p className="eyebrow">SATURDAY · SESSION 2 OF 4</p><h1>Ready when<br/><em>you are.</em></h1></div><div className="streak"><b>3</b><span>week<br/>streak</span></div></section>
      <section className="readiness" aria-label="Choose today’s readiness"><div><span>How are you feeling?</span><b>{readiness} pace</b></div><div>{(["Gentle","Steady","Strong"] as Readiness[]).map((x,i)=><button className={readiness===x?"selected":""} onClick={()=>setReadiness(x)} key={x} aria-label={`${x} readiness`}><i style={{height:12+i*6}}/></button>)}</div></section>
      <section className="week" aria-label="Weekly training rhythm">{[{d:"M",n:13,x:1},{d:"T",n:14},{d:"W",n:15,x:1},{d:"T",n:16},{d:"F",n:17},{d:"S",n:18,a:1},{d:"S",n:19}].map(d=><div className={d.a?"active":""} key={d.d+d.n}><span>{d.d}</span><b>{d.n}</b>{d.x&&<i>✓</i>}</div>)}</section>
      <section className="workout"><div className="workout-copy"><span className="tag">TODAY’S COACHED PRACTICE</span><h2>Full-body<br/>foundation</h2><p>{goal} focus · {equipment==="None"?"No equipment":equipment}</p><div className="stats"><span><b>{minutes}</b> min</span><span><b>6</b> moves</span><span><b>3</b> rounds</span></div></div><div className="hero-figure"><Figure pose="squat"/></div><button className="start" onClick={start}>Start practice <b>→</b></button></section>
      <section className="weekly-target"><div className="target-ring"><b>2</b><span>/ 4</span></div><div><p className="eyebrow">WEEKLY TARGET</p><h3>Two sessions down</h3><p>2 strength days · 1 balance block</p></div><button onClick={()=>setView("Progress")}>View</button></section>
      <section className="section-head"><div><p className="eyebrow">YOUR MOVEMENTS</p><h2>Today’s positions</h2></div><span>Tap start for live cues</span></section>
      <section className="exercise-list">{plan.map((x,i)=><article className="exercise" key={x.name}><small>0{i+1}</small><div className="exercise-visual"><Figure pose={x.pose} small/></div><div><h3>{x.name}</h3><p>{x.focus}{x.balance&&<em> · balance</em>}</p><span>{x.cue}</span></div><aside><b>{x.seconds}</b><small>SEC</small></aside></article>)}</section>
      <section className="adapt"><b>◎</b><div><h3>Adaptive, not stereotyped</h3><p>Your age guides recovery and balance work. Sex is kept as health context, while difficulty learns from readiness, experience, and your session feedback.</p><button onClick={()=>setProfile(true)}>Adjust plan</button></div></section>
    </>}

    {view==="Skills"&&<section className="subpage"><p className="eyebrow">YOUR PATH</p><h1>Build the skill.<br/><em>Own the movement.</em></h1><p className="lede">Progressions unlock only when your foundations are steady.</p><div className="skill-road"><article className="skill-card active"><span>01 · FOUNDATION</span><h2>Push pattern</h2><p>Incline → knee → strict push-up</p><div><i style={{width:"68%"}}/></div><b>68%</b></article><article className="skill-card"><span>02 · CONTROL</span><h2>Strict push-up</h2><p>3 sets · smooth tempo · clean line</p><div><i style={{width:"35%"}}/></div><b>35%</b></article><article className="skill-card locked"><span>03 · SKILL</span><h2>Archer push-up</h2><p>Complete strict push-up control to unlock.</p><strong>LOCKED</strong></article></div><button className="primary-action" onClick={()=>setView("Today")}>Train today’s foundation</button></section>}

    {view==="Progress"&&<section className="subpage progress-page"><p className="eyebrow">YOUR PROGRESS</p><h1>Small work.<br/><em>Real momentum.</em></h1><div className="score-grid"><article><span>THIS WEEK</span><b>42</b><small>minutes</small></article><article><span>CONSISTENCY</span><b>86%</b><small>last 4 weeks</small></article></div><section className="chart-card"><header><div><span>TRAINING LOAD</span><b>Steady and sustainable</b></div><em>+12%</em></header><div className="bars">{[42,58,36,72,54,84,64].map((h,i)=><div key={i}><i style={{height:`${h}%`}}/><span>{"MTWTFSS"[i]}</span></div>)}</div></section><section className="milestone"><b>✓</b><div><span>LATEST WIN</span><h3>3-week consistency streak</h3><p>You trained at least twice each week.</p></div></section><section className="guideline"><span>WEEKLY HEALTH BASELINE</span><h3>Strength all major muscle groups at least 2 days a week.</h3><p>For adults 65+, include balance activity too. Your plan emphasizes balance automatically for the 60+ age range.</p></section></section>}

    <nav className="bottom-nav" aria-label="Primary navigation">{[["●","Today"],["◇","Skills"],["▥","Progress"]].map(x=><button className={view===x[1]?"selected":""} onClick={()=>setView(x[1] as View)} key={x[1]}><span>{x[0]}</span>{x[1]}</button>)}</nav>

    {profile&&<div className="overlay" role="dialog" aria-modal="true" aria-labelledby="profile-title"><button className="backdrop" onClick={()=>setProfile(false)} aria-label="Close profile"/><section className="sheet"><i/><button className="close" onClick={()=>setProfile(false)} aria-label="Close">×</button><p className="eyebrow">PERSONALISE YOUR PLAN</p><h2 id="profile-title">Train for your life.</h2><p className="note">We use these settings as a starting point, then learn from how each session feels.</p><fieldset><legend>Age range</legend><div className="choices ages">{ageOptions.map(x=><button className={age===x?"chosen":""} onClick={()=>setAge(x)} key={x}>{x}</button>)}</div></fieldset><fieldset><legend>Sex · optional health context</legend><div className="choices">{(["Female","Male","Prefer not to say"] as Sex[]).map(x=><button className={sex===x?"chosen":""} onClick={()=>setSex(x)} key={x}>{x}</button>)}</div></fieldset><fieldset><legend>Primary goal</legend><div className="choices">{(["Strength","Skills","Mobility"] as Goal[]).map(x=><button className={goal===x?"chosen":""} onClick={()=>setGoal(x)} key={x}>{x}</button>)}</div></fieldset><fieldset><legend>Equipment</legend><div className="choices">{(["None","Bands","Pull-up bar"] as Equipment[]).map(x=><button className={equipment===x?"chosen":""} onClick={()=>setEquipment(x)} key={x}>{x}</button>)}</div></fieldset><fieldset><legend>Experience</legend><div className="choices">{(["Beginner","Intermediate","Advanced"] as Level[]).map(x=><button className={level===x?"chosen":""} onClick={()=>setLevel(x)} key={x}>{x}</button>)}</div></fieldset><div className="preview"><span>Updated practice</span><b>{minutes} min · {plan[0].seconds} sec opening set</b></div><button className="save" onClick={saveProfile}>Save my plan</button></section></div>}

    {session&&<section className="session" role="dialog" aria-modal="true" aria-label="Guided workout"><header><button onClick={()=>{setSession(false);setRunning(false)}} aria-label="Close workout">×</button><span>MOVE {active+1} OF {plan.length}</span><button aria-label="Audio cues">◒</button></header><div className="session-title"><p>{current.focus}</p><h2>{current.name}</h2></div><div className="session-visual"><span className="tempo">3 · 1 · 2 TEMPO</span><Figure pose={current.pose}/></div><div className="cue"><span>FORM CUE</span><b>{alternate?current.easier:current.cue}</b><p>{alternate?"Use this easier position and keep the movement pain-free. Quality counts more than range.":current.detail}</p><button onClick={()=>setAlternate(v=>!v)}>{alternate?"Show standard":"Make it easier"}</button></div><div className="timer-row"><div className="timer" style={{background:`conic-gradient(#e8ff48 ${timerProgress}%,#2e302a 0)`}}><div><b>{left}</b><span>{left===0?"SET DONE":"SECONDS"}</span></div></div><button onClick={()=>setRunning(v=>!v)} aria-label={running?"Pause":"Resume"}>{running?"Ⅱ":"▶"}<span>{running?"Pause":"Resume"}</span></button><button className="next" onClick={next}>→<span>{active===5?"Finish":"Next"}</span></button></div><div className="session-progress"><i style={{width:`${(active+1)/6*100}%`}}/></div></section>}

    {finish&&<div className="finish overlay" role="dialog" aria-modal="true"><div className="backdrop"/><section className="finish-card"><span>✓</span><p className="eyebrow">PRACTICE COMPLETE</p><h2>Strong work.<br/>How did it feel?</h2><p>Your answer quietly tunes the next session.</p><div>{[[1,"Too easy"],[0,"Just right"],[-1,"Too hard"]].map(x=><button onClick={()=>rate(x[0] as number)} key={x[1]}>{x[1]}</button>)}</div></section></div>}
  </main>;
}
