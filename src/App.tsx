/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Info, 
  Monitor, 
  User,
  Calendar,
  Users,
  Table,
  Layout,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, startOfWeek, addWeeks, differenceInWeeks } from 'date-fns';
import { ko } from 'date-fns/locale';

// Constants
const CIRCLE_SEATS_COUNT = 20;
const STRAIGHT_SEATS_COUNT = 6;
const TOTAL_SEATS = CIRCLE_SEATS_COUNT + STRAIGHT_SEATS_COUNT;
const START_DATE = new Date(2026, 2, 2); // 2026년 3월 첫째 주 월요일

// Student Data
const CLASS_DATA: Record<number, string[]> = {
  1: [
    "곽하람", "김용재", "김주원", "김주하", "김채운", 
    "김태현", "모채연", "박민서", "박시율", "박신우", 
    "박영서", "박정진", "배유빈", "심보민", "이승원", 
    "이은담", "임성우", "장우진", "전소민", "전태성", 
    "정민수", "천세은", "최시은", "홍시언", "공석", "공석"
  ],
  2: [
    "강희성", "고유진", "김민아", "김민찬", "김아인", 
    "김우진", "김은기", "민승원", "박지완", "오연우", 
    "이라온", "이상현", "이승현", "임유빈", "전재윤", 
    "정시혁", "조예준", "조용진", "최서희", "한혜성", 
    "홍수빈", "홍우성", "홍은지", "공석", "공석", "공석"
  ],
  3: [
    "견영준", "고유", "권서현", "김담희", "김민형", 
    "김아인", "김태양", "노은율", "박경준", "서해인", 
    "송정우", "심영민", "안준석", "안채원", "윤주열", 
    "이정빈", "이하율", "전상빈", "전승혁", "전지우", 
    "정서연", "함재현", "홍우진", "황민준", "공석", "공석"
  ],
  4: [
    "강의재", "김도현", "김선중", "김승현", "김예담", 
    "김재율", "김지율", "노태현", "문시현", "박찬규", 
    "박하민", "박한누리", "백진원", "안현수", "이가원", 
    "이건우", "이다인", "이승재", "공석", "이제양", 
    "정예진", "최서연", "허다휘", "홍준서", "공석", "공석"
  ],
  5: [
    "김라온", "김민재", "김원재", "김주원", "문채은", 
    "박민", "박세빈", "박주원", "박준우", "백은주", 
    "송유이", "신예서", "옥서연", "이규필", "이수현", 
    "이용범", "이윤태", "이정민", "이지훈", "이하은", 
    "지윤철", "차희원", "최정혁", "한지서", "공석", "공석"
  ],
};

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState(4);
  const [viewMode, setViewMode] = useState<'chart' | 'sheets'>('chart');
  const [groupMode, setGroupMode] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[] | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const [activeNotice, setActiveNotice] = useState<'시' | '컴' | '정' | '이' | '종' | null>(null);

  const notices = {
    '시': "컴퓨터는 가지지 않고, 번호에 해당하는 자리를 찾아가 앉는다.",
    '컴': "컴퓨터를 번호 순으로 나와서 자기 번호에 해당하는 노트북을 가져간다.",
    '정': "로그아웃하고 노트북 닫는다.",
    '종': "뒷번호 부터 나와서 한명씩 자기 번호에 해당하는 틀에 집어넣는다.",
    '이': "번호 대로 앉고 노트북은 켜지 않는다."
  };

  // Calculate week offset
  const weekOffset = useMemo(() => {
    const start = startOfWeek(START_DATE, { weekStartsOn: 1 });
    const current = startOfWeek(currentDate, { weekStartsOn: 1 });
    const diff = differenceInWeeks(current, start);
    return Math.max(0, diff);
  }, [currentDate]);

  const nextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
    setShuffledIndices(null);
    setGroupMode(false);
  };
  const prevWeek = () => {
    setCurrentDate(addWeeks(currentDate, -1));
    setShuffledIndices(null);
    setGroupMode(false);
  };
  const resetToToday = () => {
    setCurrentDate(new Date());
    setShuffledIndices(null);
    setGroupMode(false);
  };

  // Grouping logic: Odd + Even
  const shuffleGroups = () => {
    const originalIndices: number[] = [];
    CLASS_DATA[selectedClass].forEach((name, idx) => {
      if (name !== "공석") {
        originalIndices.push(idx);
      }
    });

    const emptyIndices: number[] = [];
    CLASS_DATA[selectedClass].forEach((name, idx) => {
      if (name === "공석") emptyIndices.push(idx);
    });

    // Create pairs (Odd + Even from original list)
    const pairs: number[][] = [];
    for (let i = 0; i < originalIndices.length; i += 2) {
      const g = [originalIndices[i]];
      if (i + 1 < originalIndices.length) g.push(originalIndices[i+1]);
      pairs.push(g);
    }
    
    // Add empty spots as single groups
    emptyIndices.forEach(idx => pairs.push([idx]));
    
    // Shuffle all these groups
    const shuffledPairs = [...pairs].sort(() => Math.random() - 0.5);
    const finalOrder = shuffledPairs.flat();
    
    setShuffledIndices(finalOrder);
    setGroupMode(true);
  };

  const toggleGroupMode = () => {
    if (groupMode) {
      setGroupMode(false);
      setShuffledIndices(null);
    } else {
      shuffleGroups();
    }
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    
    [1, 2, 3, 4, 5].forEach(classNum => {
      let currentNum = 0;
      const data = CLASS_DATA[classNum]
        .filter(name => name !== "공석")
        .map(name => {
          currentNum++;
          return { "번호": currentNum, "이름": name };
        });
      
      const ws = XLSX.utils.json_to_sheet(data);
      // Set column widths
      ws['!cols'] = [{ wch: 10 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws, `${classNum}반`);
    });
    
    XLSX.writeFile(wb, "2학년_정보융합실_명단.xlsx");
  };

  // Seat numbering logic (Counter-Clockwise Increasing)
  // Student S = (i - weekOffset) % 26 + 1 (CCW movement)
  const getStudentInfo = (physicalIndex: number) => {
    let studentIndex: number;
    
    if (groupMode && shuffledIndices) {
      studentIndex = shuffledIndices[physicalIndex];
    } else {
      studentIndex = ((physicalIndex - weekOffset) % TOTAL_SEATS + TOTAL_SEATS) % TOTAL_SEATS;
    }

    const studentName = CLASS_DATA[selectedClass][studentIndex] || `학생 ${studentIndex + 1}`;
    
    if (studentName === "공석") {
      return { num: null, name: studentName };
    }
    
    // Count non-"공석" entries up to studentIndex to determine student's actual number
    let count = 0;
    for (let i = 0; i <= studentIndex; i++) {
      if (CLASS_DATA[selectedClass][i] !== "공석") {
        count++;
      }
    }
    
    return { num: count, name: studentName };
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-2">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Monitor className="text-white w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-800">정보 융합실 좌석표</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-wider border border-indigo-100">
                    2학년 {selectedClass}반
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Seating Management</span>
                </div>
              </div>
            </div>

            {/* Class Selector */}
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setViewMode('chart')}
                  className={`p-2 rounded-xl transition-all ${
                    viewMode === 'chart' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="좌석표 보기"
                >
                  <Layout size={20} />
                </button>
                <button
                  onClick={() => setViewMode('sheets')}
                  className={`p-2 rounded-xl transition-all ${
                    viewMode === 'sheets' 
                      ? 'bg-white text-emerald-600 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="명단 보기"
                >
                  <Table size={20} />
                </button>
                
                <div className="w-px h-6 bg-slate-200 mx-2 self-center" />

                {[1, 2, 3, 4, 5].map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedClass(c)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      selectedClass === c 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {c}반
                  </button>
                ))}
              </div>

            {/* Notice Buttons */}
            <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 mr-1">Notice</div>
              {(['시', '컴', '정', '종', '이'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveNotice(activeNotice === type ? null : type)}
                  className={`w-10 h-10 rounded-xl font-black transition-all flex items-center justify-center ${
                    activeNotice === type 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' 
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Group Mode & Date Controls */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={toggleGroupMode}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${
                    groupMode 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                      : 'text-slate-500 hover:text-slate-700 bg-white shadow-sm'
                  }`}
                >
                  <Users size={16} />
                  {groupMode ? '모듬 모드 ON' : '모듬 배치'}
                </button>
                {groupMode && (
                  <button
                    onClick={shuffleGroups}
                    className="p-2 text-indigo-600 hover:text-indigo-800 transition-colors"
                    title="다시 섞기"
                  >
                    <RotateCcw size={18} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button 
                  onClick={prevWeek}
                  className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600 active:scale-90"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="px-6 py-1.5 flex flex-col items-center min-w-[160px]">
                  <span className="text-sm font-black text-slate-700">
                    {format(currentDate, 'yyyy년 M월', { locale: ko })} {Math.ceil(currentDate.getDate() / 7)}주차
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold tracking-tighter">
                    {groupMode ? '모듬 랜덤 배치 적용됨' : `${weekOffset}주차 순환 적용됨`}
                  </span>
                </div>
                <button 
                  onClick={nextWeek}
                  className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600 active:scale-90"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="w-px h-8 bg-slate-200 mx-1" />
                <button 
                  onClick={resetToToday}
                  className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600 active:scale-90"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Notice Display */}
        <AnimatePresence>
          {activeNotice && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-indigo-600 text-white p-6 rounded-[2rem] shadow-xl shadow-indigo-200 flex items-center gap-6 border border-indigo-500">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                  <span className="text-2xl font-black">{activeNotice}</span>
                </div>
                <p className="text-lg md:text-xl font-bold leading-tight">
                  {notices[activeNotice]}
                </p>
                <button 
                  onClick={() => setActiveNotice(null)}
                  className="ml-auto p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <RotateCcw size={20} className="rotate-45" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Mode Content */}
        {viewMode === 'chart' ? (
          <>
            {groupMode ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-white rounded-[2rem] shadow-2xl shadow-slate-300/50 border border-slate-200/50 p-8 md:p-12 overflow-hidden min-h-[500px]"
              >
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Users className="text-white w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">활동 모듬 순서</h2>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">Randomized Group Sequence</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={shuffleGroups}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-xl shadow-indigo-100 hover:-translate-y-0.5 active:scale-95"
                      >
                        <RotateCcw size={18} />
                        순서 다시 섞기
                      </button>
                      <button
                        onClick={toggleGroupMode}
                        className="p-3 bg-slate-100 text-slate-500 hover:text-slate-700 rounded-2xl transition-all"
                        title="좌석 배치로 돌아가기"
                      >
                        <Layout size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {(() => {
                      // Reconstruct groups from shuffledIndices or logic
                      const groups: { num1: number | null, name1: string, num2?: number | null, name2?: string }[] = [];
                      if (!shuffledIndices) return null;

                      // We need to know which ones were pairs
                      // Actually, the previous implementation flattened pairs then shuffled.
                      // That's WRONG if we want to show pairs together.
                      // Let's look at shuffleGroups again.
                      // It shuffled the PAIRS, then flattened. So neighbors index i and i+1 are indeed the group.
                      // WAIT: line 131: pairs.push(g); -> g has 1 or 2 elements.
                      // line 138: finalOrder = shuffledPairs.flat();
                      // This means finalOrder is just a flat list of student indices.
                      
                      // I should probably just iterate through the flattened list or use the original pairs.
                      // Let's use the pairs logic here to render.
                      
                      // For rendering, I'll calculate pairs based on the same logic used to generate them
                      let currentGroupIdx = 1;
                      const renderedGroups = [];
                      
                      // Let's look at how shuffleGroups works. 
                      // It constructs pairs, shuffles them, then flattens.
                      // To render "Sequence of Groups", I'll just iterate through the flattened indices.
                      // But how do I know if index i and i+1 belong together? 
                      // The original logic paired [0,1], [2,3]... correctly.
                      
                      const studentInfos = shuffledIndices.map(idx => {
                        const name = CLASS_DATA[selectedClass][idx];
                        if (name === "공석") return { name, num: null };
                        
                        let count = 0;
                        for (let i = 0; i <= idx; i++) {
                          if (CLASS_DATA[selectedClass][i] !== "공석") count++;
                        }
                        return { name, num: count };
                      });

                      // Filter out empty spots for the "Sequence View" as it's cleaner
                      const activeStudents = studentInfos.filter(s => s.name !== "공석");
                      
                      for (let i = 0; i < activeStudents.length; i += 2) {
                        const s1 = activeStudents[i];
                        const s2 = activeStudents[i+1];
                        
                        renderedGroups.push(
                          <motion.div
                            key={`group-${i}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col items-center gap-4 hover:shadow-lg transition-all hover:bg-white hover:border-indigo-200 group"
                          >
                            <div className="flex items-center gap-3 w-full border-b border-slate-100 pb-3 mb-1">
                              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-100">
                                {currentGroupIdx++}
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">모듬</span>
                            </div>
                            
                            <div className="flex items-center justify-center gap-6 w-full">
                              <div className="flex flex-col items-center flex-1">
                                <span className="text-indigo-600 font-black text-[10px] mb-1">{s1.num}번</span>
                                <span className="text-lg font-black text-slate-800">{s1.name}</span>
                              </div>
                              
                              {s2 ? (
                                <>
                                  <div className="w-px h-10 bg-slate-200" />
                                  <div className="flex flex-col items-center flex-1">
                                    <span className="text-indigo-600 font-black text-[10px] mb-1">{s2.num}번</span>
                                    <span className="text-lg font-black text-slate-800">{s2.name}</span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex-1" />
                              )}
                            </div>
                          </motion.div>
                        );
                      }
                      return renderedGroups;
                    })()}
                  </div>
                </div>

                {/* Bottom Guide */}
                <div className="mt-12 p-6 bg-slate-900 rounded-3xl text-white/80 text-center relative z-10 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-indigo-500/5 pointer-events-none" />
                  <p className="text-xs font-bold flex items-center justify-center gap-2">
                    <Info size={14} className="text-indigo-400" />
                    홀수 번호와 짝수 번호가 한 모듬으로 매칭되어 임의의 순서로 배치되었습니다.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="relative bg-white rounded-[2rem] shadow-2xl shadow-slate-300/50 border border-slate-200/50 p-4 md:p-6 overflow-hidden">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                {/* Podium (Teacher's Desk) */}
                <div className="flex justify-center mb-6 relative z-10">
                  <motion.div 
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-48 h-16 bg-slate-900 rounded-2xl shadow-xl flex flex-col items-center justify-center border-b-[4px] border-slate-950"
                  >
                    <div className="flex items-center gap-2 text-white mb-0.5">
                      <User size={16} className="text-indigo-400" />
                      <span className="font-black tracking-[0.2em] text-[10px]">교탁 (FRONT)</span>
                    </div>
                    <div className="flex w-full px-6 justify-between mt-0.5">
                      <div className="flex flex-col items-center">
                        <ChevronLeft size={10} className="text-slate-500" />
                        <span className="text-[8px] text-slate-500 font-black uppercase">Right</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <ChevronRight size={10} className="text-slate-500" />
                        <span className="text-[8px] text-slate-500 font-black uppercase">Left</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Seating Area */}
                <div className="relative flex flex-col items-center gap-4">
                  {/* Circular Seating */}
                  <div className="relative w-[260px] h-[260px] md:w-[400px] md:h-[400px]">
                    {Array.from({ length: CIRCLE_SEATS_COUNT }).map((_, i) => {
                      const openAngle = 0.2 * 2 * Math.PI;
                      const availableAngle = 2 * Math.PI - openAngle;
                      const startOffset = Math.PI / 2 + availableAngle / 2;
                      const angle = startOffset - (i * availableAngle) / (CIRCLE_SEATS_COUNT - 1);
                      
                      const radius = typeof window !== 'undefined' && window.innerWidth < 768 ? 120 : 180;
                      const x = Math.cos(angle) * radius;
                      const y = Math.sin(angle) * radius;

                      const { num, name } = getStudentInfo(i);

                      return (
                        <Seat 
                          key={`circle-${i}`}
                          index={i}
                          studentNum={num || 0}
                          studentName={name}
                          x={x}
                          y={y}
                          isHovered={hoveredSeat === i}
                          onHover={() => setHoveredSeat(i)}
                          onLeave={() => setHoveredSeat(null)}
                        />
                      );
                    })}
                    
                    {/* Center Info */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center bg-slate-50/50 backdrop-blur-sm p-4 rounded-full border border-slate-100">
                        <div className="text-indigo-300 font-black text-[8px] mb-0.5 uppercase tracking-[0.3em]">Circle</div>
                        <div className="text-slate-800 font-black text-3xl tracking-tighter">20</div>
                      </div>
                    </div>
                  </div>

                  {/* Straight Seating (Back Row) */}
                  <div className="flex flex-row gap-2 md:gap-4 mt-2">
                    {Array.from({ length: STRAIGHT_SEATS_COUNT }).map((_, i) => {
                      const physicalIndex = CIRCLE_SEATS_COUNT + i;
                      const { num, name } = getStudentInfo(physicalIndex);
                      
                      return (
                        <Seat 
                          key={`straight-${i}`}
                          index={physicalIndex}
                          studentNum={num || 0}
                          studentName={name}
                          isHovered={hoveredSeat === physicalIndex}
                          onHover={() => setHoveredSeat(physicalIndex)}
                          onLeave={() => setHoveredSeat(null)}
                          isStraight
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Info Cards */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-4 mb-6 text-indigo-600">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <h3 className="font-black text-lg">학급 정보</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-400">현재 학급</span>
                    <span className="text-sm font-black text-indigo-600">2학년 {selectedClass}반</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-400">총 인원</span>
                    <span className="text-sm font-black text-slate-700">26명 (공석 포함)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-400">이동 주기</span>
                    <span className="text-sm font-black text-slate-700">매주 1칸 (오른쪽)</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-4 mb-6 text-emerald-600">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <h3 className="font-black text-lg">순환 상태</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1.5">Rotation Progress</div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(weekOffset % TOTAL_SEATS) / TOTAL_SEATS * 100}%` }}
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    3월 2일 기준 <span className="text-emerald-600 font-bold">{weekOffset}주</span>가 경과하여 좌석이 순환되었습니다.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                <h3 className="font-black text-lg mb-6 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  시스템 가이드
                </h3>
                <div className="space-y-4 opacity-90">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 bg-white/10 rounded-md flex items-center justify-center text-[10px] font-bold">1</div>
                    <p className="text-[11px] leading-relaxed">번호는 교탁 우측에서 좌측으로 **반시계 방향**으로 증가합니다.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 bg-white/10 rounded-md flex items-center justify-center text-[10px] font-bold">2</div>
                    <p className="text-[11px] leading-relaxed">매주 학생들은 자신의 **오른쪽(반시계 방향)** 좌석으로 한 칸씩 이동합니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-200"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <Table size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">학급 명단 시트</h2>
                  <p className="text-slate-400 text-sm font-bold">전체 학급 학생 명단 및 번호 확인</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={downloadExcel}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-black transition-all shadow-lg shadow-emerald-200"
                >
                  <Download size={18} />
                  Excel 다운로드
                </button>
                <div className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Class Roster Sheets</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5].map((classNum) => {
                let currentNum = 0;
                return (
                  <div key={`sheet-${classNum}`} className={`rounded-3xl border transition-all ${selectedClass === classNum ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-100'}`}>
                    <div className={`px-6 py-4 border-b flex items-center justify-between ${selectedClass === classNum ? 'border-emerald-100' : 'border-slate-100'}`}>
                      <h3 className={`font-black ${selectedClass === classNum ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {classNum}반 명단
                      </h3>
                      <button 
                        onClick={() => setSelectedClass(classNum)}
                        className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${selectedClass === classNum ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                      >
                        Select
                      </button>
                    </div>
                    <div className="p-2">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-slate-400 font-bold border-b border-slate-100/50">
                            <th className="px-4 py-2 font-black text-[10px] uppercase">No.</th>
                            <th className="px-4 py-2 font-black text-[10px] uppercase">Name</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                          {CLASS_DATA[classNum].map((name, idx) => {
                            if (name === "공석") return null;
                            currentNum++;
                            return (
                              <tr key={idx} className="hover:bg-white/60 transition-colors">
                                <td className="px-4 py-2 text-indigo-600 font-black">{currentNum}</td>
                                <td className="px-4 py-2 font-bold text-slate-700">{name}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-12 text-center border-t border-slate-200 mt-12">
        <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase">
          &copy; 2026 Information Fusion Lab • Middle School Seating System
        </p>
      </footer>
    </div>
  );
}

interface SeatProps {
  index: number;
  studentNum: number;
  studentName: string;
  x?: number;
  y?: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  isStraight?: boolean;
  key?: React.Key;
}

function Seat({ index, studentNum, studentName, x, y, isHovered, onHover, onLeave, isStraight }: SeatProps) {
  const isEmpty = studentName === "공석";

  return (
    <motion.div
      layout
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        x: x ?? 0,
        y: y ?? 0,
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 30,
        delay: index * 0.01 
      }}
      style={{
        position: isStraight ? 'relative' : 'absolute',
        left: isStraight ? 'auto' : '50%',
        top: isStraight ? 'auto' : '50%',
        marginLeft: isStraight ? 0 : -32,
        marginTop: isStraight ? 0 : -32,
      }}
      className={`
        w-11 h-11 md:w-15 md:h-15 rounded-xl md:rounded-2xl flex items-center justify-center cursor-pointer
        transition-all duration-500 select-none border-2
        ${isEmpty ? 'opacity-30 grayscale' : ''}
        ${isHovered 
          ? 'bg-indigo-600 text-white border-indigo-400 shadow-xl shadow-indigo-200 -translate-y-1 z-20' 
          : 'bg-white text-slate-700 border-slate-100 shadow-md hover:border-indigo-200 z-10'}
      `}
    >
      <div className="flex flex-col items-center text-center px-0.5">
        <AnimatePresence mode="wait">
          <motion.div 
            key={`${studentName}-${studentNum}`}
            initial={{ y: 3, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -3, opacity: 0 }}
            className="flex flex-col items-center"
          >
            <span className={`text-[9px] md:text-[11px] font-black tracking-tighter ${isHovered ? 'text-white' : 'text-indigo-600'}`}>
              {studentNum}
            </span>
            <span className={`text-[7px] md:text-[9px] font-bold leading-tight truncate max-w-[38px] md:max-w-[54px] ${isHovered ? 'text-indigo-100' : 'text-slate-500'}`}>
              {studentName}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hover Tooltip */}
      {isHovered && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap pointer-events-none z-30 flex flex-col items-center gap-0.5"
        >
          <span className="text-indigo-400 text-[8px] uppercase tracking-widest">
            {studentName === "공석" ? "Empty Seat" : `Student ${studentNum}`}
          </span>
          <span className="text-sm">{studentName}</span>
        </motion.div>
      )}
    </motion.div>
  );
}
