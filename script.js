
/* Классы для обработки и исключения */
const classesToRead    = ['t220__text','t225','t004','t508','t513.t-section__title',
                          't513__time','t513__title','t431','t195__text',
                          't544__title','t544__descr','t157__text'];
const classesToExclude = ['uc-ctgr-link.t004'];

document.addEventListener('DOMContentLoaded', () => {
  const playBtn   = document.getElementById('playPauseBtn');
  const playIcon  = playBtn.querySelector('i');
  const progressC = document.getElementById('progressBarContainer');
  const progressF = document.getElementById('progressFill');
  const synth     = window.speechSynthesis;

  const ICON_PLAY  = 'icon-play';
  const ICON_PAUSE = 'icon-pause';

  let utter   = null;
  let fullText = '';
  let startOffset = 0;      

  /* Собираем и кэшируем текст*/
  function buildSelector(list) {
    return list.map(cls => cls.split(/\s+/).map(c => `[class~="${c}"]`).join('')).join(',');
  }
  function collectText() {
    const readSel = buildSelector(classesToRead);
    const skipSel = buildSelector(classesToExclude);
    const nodes   = document.querySelectorAll(readSel);
    const skipSet = new Set(document.querySelectorAll(skipSel));

    let out = '';
    nodes.forEach(n => {
      if (!skipSet.has(n) && !n.closest(skipSel)) out += n.textContent.trim() + ' ';
    });
    return out.trim();
  }

  /* Кнопка Play/Pause */
  function setUI(state) {
    playIcon.classList.remove(ICON_PLAY, ICON_PAUSE);
    playIcon.classList.add(state === 'pause' ? ICON_PAUSE : ICON_PLAY);
    playBtn.title = state === 'pause' ? 'Пауза' : 'Воспроизвести';
  }
  function disableBtn(d = true) { playBtn.disabled = d; }
  function setProgress(p) { progressF.style.width = Math.min(p, 100) + '%'; }

  /* Обработчик вопспроизведения и перемотки */
  function speakFrom(offset = 0) {
    disableBtn(true);
    synth.cancel();
    setTimeout(() => {
      fullText = fullText || collectText();
      if (!fullText) { console.log('Нет текста'); setUI('stop'); disableBtn(false); return; }

      const textToSpeak = fullText.slice(offset);
      utter = new SpeechSynthesisUtterance(textToSpeak);
      utter.lang = 'ru-RU';

      utter.onstart = () => { setUI('pause'); disableBtn(false); };
      utter.onend   = () => { setUI('stop'); setProgress(100);
                              setTimeout(() => setProgress(0), 300);
                              startOffset = 0; };
      utter.onboundary = e => {
        if (e.name === 'word') {
          const globalIndex = offset + e.charIndex + e.charLength;
          setProgress(globalIndex / fullText.length * 100);
        }
      };

      synth.speak(utter);
    }, 50);
  }

  /* Обработчки событий кнопки */
  playBtn.addEventListener('click', () => {
    if (synth.speaking && !synth.paused) {
      synth.pause();
      setUI('play');
    } else if (synth.paused) {
      synth.resume();
      setUI('pause');
    } else {
      fullText = '';          
      startOffset = 0;
      speakFrom(0);
    }
  });

  /* Обработчик прогрессбара */
  progressC.addEventListener('click', e => {
    const rect = progressC.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newOffset = Math.floor(ratio * fullText.length);

    startOffset = newOffset;
    speakFrom(newOffset);
  });
});
