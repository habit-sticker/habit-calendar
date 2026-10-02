// ========================================
// HTML要素を取得
// ========================================

const calendarDays = document.querySelector(".calendar-days");
const calendarTitle = document.querySelector("#calendar-title");
const prevButton = document.querySelector("#prev-month");
const nextButton = document.querySelector("#next-month");

const habitModal = document.querySelector("#habit-modal");
// 下のタブと3つのページを取得
const navButtons = document.querySelectorAll(".nav-button");
const pages = document.querySelectorAll(".page");

const closeModal = document.querySelector("#close-modal");
const selectedDate = document.querySelector("#selected-date");
const habitList = document.querySelector("#habit-list");
const saveRecordButton = document.querySelector("#save-record-button");
const habitCount = document.querySelector("#habit-count");
const activeHabitList = document.querySelector("#active-habit-list");
const addHabitButton = document.querySelector("#add-habit-button");
const addHabitModal = document.querySelector("#add-habit-modal");
const closeAddHabitModal = document.querySelector("#close-add-habit-modal");
const stickerButtons = document.querySelectorAll(".sticker-button");
const habitNameInput = document.querySelector("#habit-name-input");
const saveHabitButton = document.querySelector("#save-habit-button");
const habitDetailModal = document.querySelector("#habit-detail-modal");
const closeHabitDetail = document.querySelector("#close-habit-detail");
const detailHabitTitle = document.querySelector("#detail-habit-title");
const detailHabitSlot = document.querySelector("#detail-habit-slot");
const completeHabitButton = document.querySelector("#complete-habit-button");
const deleteHabitButton = document.querySelector("#delete-habit-button");
const completedHabitList = document.querySelector("#completed-habit-list");


// ========================================
// アプリの状態・データ「今どんな状態なのか」を覚えておくデータが並んでる。
// ========================================
let selectedSticker = ""
let selectedHabitId = "";
let selectedSlot = null;
let temporaryRecords = [];

// 最初に表示する年月
let currentYear = 2026;
let currentMonth = 8;

let habits = JSON.parse(localStorage.getItem("habits")) || [
  {
    id: "running-001",
    name: "ランニング",
    sticker: "👟",
    slot: 0,
    status: "active"
  },
  {
    id: "reading-001",
    name: "読書",
    sticker: "📖",
    slot: 1,
    status: "active"
  },
  {
    id: "morning-001",
    name: "朝活",
    sticker: "☀️",
    slot: 2,
    status: "active"
  }
];

// ========================================
// 挑戦中の習慣を表示
// ========================================
function displayHabits() {

  // 挑戦中の習慣だけを取り出す
  const activeHabits = habits.filter(function(habit) {
    return habit.status === "active";
  });


  // 挑戦中の数を表示
  habitCount.textContent =
    `挑戦中 ${activeHabits.length} / 9`;

  // 9個埋まったら追加ボタンを押せなくする
  if (activeHabits.length >= 9) {
    addHabitButton.disabled = true;
    addHabitButton.textContent = "習慣は9個まで";
  } else {
    addHabitButton.disabled = false;
    addHabitButton.textContent = "＋ 習慣を追加";
  }

  // 一覧をいったん空にする
  activeHabitList.innerHTML = "";

  // ①〜⑨を順番に作る
  for (let slot = 0; slot < 9; slot++) {

    // この枠を使っている習慣を探す
    const habit = activeHabits.find(function(habit) {
      return habit.slot === slot;
    });

    // 習慣が入っている場合
    if (habit) {

      const habitItem = document.createElement("button");
      habitItem.classList.add("habit-item");

      const sticker = document.createElement("span");
      sticker.classList.add("habit-sticker");
      sticker.textContent = habit.sticker;

      const name = document.createElement("span");
      name.classList.add("habit-name");
      name.textContent = habit.name;

      habitItem.appendChild(sticker);
      habitItem.appendChild(name);

      habitItem.addEventListener("click", function() {

        selectedHabitId = habit.id;

        detailHabitTitle.textContent =
          `${habit.sticker} ${habit.name}`;

        detailHabitSlot.textContent =
          `使用枠：${habit.slot + 1}`;

        habitDetailModal.style.display = "flex";

      });

      activeHabitList.appendChild(habitItem);

      } else {

  // 習慣が入っていない場合
  const emptyItem = document.createElement("button");
  emptyItem.classList.add("habit-item", "empty-habit-item");

  emptyItem.textContent = `まだいけるよ！`;

emptyItem.addEventListener("click", function() {

  selectedSlot = slot;

  addHabitModal.style.display = "flex";

});

  activeHabitList.appendChild(emptyItem);

}
  }
}

// ========================================
// 習慣の記録データを読み込み・整理。保存されている日々の記録を読み込んだり、昔の形式の記録を現在のID方式に変換したりしている
// ========================================
let records = JSON.parse(localStorage.getItem("habitRecords")) || {};

// 古い記録（0, 1, 2）を習慣IDに変換する
Object.keys(records).forEach(function(dateKey) {

  records[dateKey] = records[dateKey].map(function(record) {

    if (typeof record === "number" && habits[record]) {
      return habits[record].id;
    }

    return record;
  });

});

localStorage.setItem(
  "habitRecords",
  JSON.stringify(records)
);

function findFirstRecordDate(habitId) {

  const recordedDates = Object.keys(records)
    .filter(function(dateKey) {
      return records[dateKey].includes(habitId);
    })
    .sort(function(a, b) {
      return new Date(a) - new Date(b);
    });

  return recordedDates[0] || null;
}

habits.forEach(function(habit) {

  if (!habit.startDate) {
    habit.startDate = findFirstRecordDate(habit.id);
  }

});

localStorage.setItem(
  "habits",
  JSON.stringify(habits)
);


// ========================================
// カレンダーを作成・表示
// ========================================

// カレンダーを作る関数
function createCalendar() {

  // 前に表示していた日付をいったん全部消す
  calendarDays.innerHTML = "";

  // 今表示している年月をタイトルにする
  calendarTitle.textContent =
    `${currentYear}年${currentMonth + 1}月`;

  // その月の1日
  const firstDay = new Date(currentYear, currentMonth, 1);

  // その月の最終日
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  // 1日が何曜日か
  const firstDayOfWeek = firstDay.getDay();

  // その月が何日まであるか
  const lastDate = lastDay.getDate();

  // 1日より前の空白を作る
  for (let i = 0; i < firstDayOfWeek; i++) {
    const emptyDay = document.createElement("div");
    calendarDays.appendChild(emptyDay);
  }

for (let day = 1; day <= lastDate; day++) {

  // 1日分の大きなマスを作る
  const dayBox = document.createElement("div");
  dayBox.classList.add("day");

  const dayOfWeek =
  new Date(currentYear, currentMonth, day).getDay();

if (dayOfWeek === 0) {
  dayBox.classList.add("sunday");
}

if (dayOfWeek === 6) {
  dayBox.classList.add("saturday");
}

  // 日付の数字を作る
  const dayNumber = document.createElement("div");
  dayNumber.classList.add("day-number");
  dayNumber.textContent = day;

  // シールを置く場所を作る
  const stickerArea = document.createElement("div");
  stickerArea.classList.add("sticker-area");

const dateKey =
  `${currentYear}-${currentMonth + 1}-${day}`;

for (let i = 0; i < 9; i++) {

  const stickerSlot = document.createElement("div");
  stickerSlot.classList.add("sticker-slot");

  if (records[dateKey]) {

    records[dateKey].forEach(function(habitId) {

      const recordedHabit = habits.find(function(habit) {
        return habit.id === habitId;
      });

      if (
        recordedHabit &&
        recordedHabit.slot === i
      ) {
        stickerSlot.textContent =
          recordedHabit.sticker;
      }

    });

  }

  stickerArea.appendChild(stickerSlot);
}

  // 日付とシール置き場を1日のマスに入れる
  dayBox.appendChild(dayNumber);
  dayBox.appendChild(stickerArea);

dayBox.addEventListener("click", function() {

  selectedDate.textContent =
    `${currentYear}年${currentMonth + 1}月${day}日`;
  selectedDate.dataset.dateKey = dateKey;

  habitList.innerHTML = "";

  const clickedDate =
  new Date(currentYear, currentMonth, day);

const today = new Date();

today.setHours(0, 0, 0, 0);

const isPast = clickedDate < today;

  
  const recordedHabitIds = records[dateKey] || [];
temporaryRecords = [...recordedHabitIds];
const recordedHabits = recordedHabitIds
  .map(function(habitId) {

    return habits.find(function(habit) {
      return habit.id === habitId;
    });

  })
  .filter(function(habit) {
   return habit !== undefined;
  });

  if (recordedHabits.length > 0) {

  const recordTitle = document.createElement("p");
  recordTitle.classList.add("modal-section-title");
  recordTitle.textContent = "この日の記録";
  habitList.appendChild(recordTitle);

  recordedHabits.forEach(function(habit) {

    const recordItem = document.createElement("div");

    recordItem.textContent =
      `${habit.sticker} ${habit.name}`;

    habitList.appendChild(recordItem);
  });

}

const activeTitle = document.createElement("p");
activeTitle.classList.add("modal-section-title");
activeTitle.textContent = "記録する習慣";
habitList.appendChild(activeTitle);

habits
  .filter(function(habit) {
    return habit.status === "active";
  })
  .forEach(function(habit) {


const habitButton = document.createElement("button");
habitButton.classList.add("record-habit-button");

const isRecorded = recordedHabitIds.includes(habit.id);

habitButton.textContent =
  `${isRecorded ? "✓ " : ""}${habit.sticker} ${habit.name}`;

  habitButton.addEventListener("click", function() {

  if (temporaryRecords.includes(habit.id)) {

    temporaryRecords =
      temporaryRecords.filter(function(item) {
        return item !== habit.id;
      });

    habitButton.textContent =
      `${habit.sticker} ${habit.name}`;

  } else {

    const sameSlotHabit = temporaryRecords.find(function(habitId) {

      const recordedHabit = habits.find(function(item) {
        return item.id === habitId;
      });

      return recordedHabit &&
        recordedHabit.slot === habit.slot;
    });

    if (sameSlotHabit) {
      alert("この枠には、その日の別の習慣がすでに記録されています");
      return;
    }

    temporaryRecords.push(habit.id);

    habitButton.textContent =
      `✓ ${habit.sticker} ${habit.name}`;
  }

});

  habitList.appendChild(habitButton);

});


  habitModal.style.display = "flex";

});

  // 完成した1日のマスをカレンダーに入れる
  calendarDays.appendChild(dayBox);
}
}

// ========================================
// カレンダーの操作
// ========================================
// ←戻るを押したとき
prevButton.addEventListener("click", function() {
  currentMonth--;

  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }

  createCalendar();
});

// →を押したとき
nextButton.addEventListener("click", function() {
  currentMonth++;

  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }

  createCalendar();
});

// ×を押したらモーダルを閉じる
closeModal.addEventListener("click", function() {
  habitModal.style.display = "none";
});

// ========================================
// 達成済みの習慣を表示
// ========================================
// 達成済みの習慣を表示する
function displayCompletedHabits() {

  const completedHabits = habits.filter(function(habit) {
    return habit.status === "completed";
  });

  completedHabitList.innerHTML = "";

completedHabits.forEach(function(habit) {

  const habitItem = document.createElement("div");
  habitItem.classList.add("completed-habit-item");

 const habitSticker = document.createElement("span");
habitSticker.classList.add("completed-habit-sticker");
habitSticker.textContent = habit.sticker;

const habitName = document.createElement("span");
habitName.classList.add("completed-habit-name");
habitName.textContent = habit.name;

const completedDate = document.createElement("span");
completedDate.classList.add("completed-date");
completedDate.textContent = habit.completedDate;

  const deleteButton = document.createElement("button");
  deleteButton.classList.add("completed-delete-button");
  deleteButton.textContent = "削除";

  deleteButton.addEventListener("click", function() {

  habit.status = "deleted";

  localStorage.setItem(
    "habits",
    JSON.stringify(habits)
  );

  displayCompletedHabits();
  createCalendar();

});

  habitItem.appendChild(habitSticker);
habitItem.appendChild(habitName);
habitItem.appendChild(completedDate);
habitItem.appendChild(deleteButton);


  completedHabitList.appendChild(habitItem);

});

}

// ========================================
// 達成済みの習慣を表示
// ========================================
// 下のタブを押したとき
navButtons.forEach(function(button) {

  button.addEventListener("click", function() {

    // いったん全部のタブを非選択にする
    navButtons.forEach(function(btn) {
      btn.classList.remove("active");
    });

    // いったん全部のページを隠す
    pages.forEach(function(page) {
      page.classList.remove("active-page");
    });

    // 押したタブを選択状態にする
    button.classList.add("active");

    // 押したボタンがどのページか調べる
    const pageName = button.dataset.page;

    // 対応するページを表示する
    const targetPage =
      document.querySelector(`#${pageName}-page`);

    targetPage.classList.add("active-page");

  });

});

// 「＋習慣を追加」を押したとき
addHabitButton.addEventListener("click", function() {

  selectedSlot = null;

  addHabitModal.style.display = "flex";
});

// ========================================
// 習慣の詳細・完了・削除
// ========================================
// 習慣追加画面の戻るを押したとき
closeAddHabitModal.addEventListener("click", function() {
  addHabitModal.style.display = "none";
});

// シールを選んだとき
stickerButtons.forEach(function(button) {

  button.addEventListener("click", function() {

    // いったん全部の選択を解除
    stickerButtons.forEach(function(btn) {
      btn.classList.remove("selected");
    });

    // 押したシールを選択状態にする
    button.classList.add("selected");

    // 選んだシールを覚えておく
    selectedSticker = button.dataset.sticker;

  });

});

// 新しい習慣を登録する
saveHabitButton.addEventListener("click", function() {

  const habitName = habitNameInput.value.trim();

  // 習慣名が入力されていない
  if (habitName === "") {
    alert("習慣名を入力してください");
    return;
  }

  // シールが選ばれていない
  if (selectedSticker === "") {
    alert("シールを選んでください");
    return;
  }

  // 使われている枠を調べる
  const usedSlots = habits
    .filter(function(habit) {
      return habit.status === "active";
    })
    .map(function(habit) {
      return habit.slot;
    });

  // 空いている枠を探す
  let emptySlot = -1;

  for (let i = 0; i < 9; i++) {

    if (!usedSlots.includes(i)) {
      emptySlot = i;
      break;
    }

  }

  // 9枠全部使われている
  if (emptySlot === -1) {
    alert("挑戦できる習慣は9個までです");
    return;
  }

  const targetSlot =
  selectedSlot !== null ? selectedSlot : emptySlot;

  const slotAlreadyUsed = habits.some(function(habit) {
  return habit.status === "active" &&
    habit.slot === targetSlot;
});

if (slotAlreadyUsed) {
  alert("この枠はすでに使われています");
  return;
}

  // 新しい習慣を作る
  const newHabit = {
    id: "habit-" + Date.now(),
    name: habitName,
    sticker: selectedSticker,
    slot: targetSlot,
    status: "active",
    startDate: new Date().toISOString().split("T")[0]
  };

  habits.push(newHabit);

  // 習慣一覧を保存
  localStorage.setItem(
    "habits",
    JSON.stringify(habits)
  );

  // 習慣画面を更新
  displayHabits();

  // カレンダーも更新
  createCalendar();

  // 入力欄をリセット
  habitNameInput.value = "";
  selectedSticker = "";

  stickerButtons.forEach(function(button) {
    button.classList.remove("selected");
  });

  // モーダルを閉じる
  addHabitModal.style.display = "none";

});

// 習慣詳細画面の×を押したとき
closeHabitDetail.addEventListener("click", function() {
  habitDetailModal.style.display = "none";
});

// 「習慣化できた！」を押したとき
completeHabitButton.addEventListener("click", function() {

  const habit = habits.find(function(habit) {
    return habit.id === selectedHabitId;
  });

  if (!habit) {
    return;
  }

  habit.status = "completed";
  habit.completedDate =
  new Date().toISOString().split("T")[0];

  localStorage.setItem(
    "habits",
    JSON.stringify(habits)
  );

  displayHabits();
displayCompletedHabits();
createCalendar();

  habitDetailModal.style.display = "none";

});

// 「削除」を押したとき
deleteHabitButton.addEventListener("click", function() {

  const habit = habits.find(function(habit) {
    return habit.id === selectedHabitId;
  });

  if (!habit) {
    return;
  }

  habit.status = "deleted";

  localStorage.setItem(
    "habits",
    JSON.stringify(habits)
  );

  displayHabits();
  createCalendar();

  habitDetailModal.style.display = "none";

});

// ========================================
// 日付ごとの習慣記録を保存
// ========================================
saveRecordButton.addEventListener("click", function() {

  if (!selectedDate.dataset.dateKey) {
    return;
  }

  const dateKey = selectedDate.dataset.dateKey;

  records[dateKey] = [...temporaryRecords];

  localStorage.setItem(
    "habitRecords",
    JSON.stringify(records)
  );

  createCalendar();

  habitModal.style.display = "none";
});

// ========================================
// アプリを最初に表示
// ========================================
createCalendar();
displayHabits();
displayCompletedHabits();