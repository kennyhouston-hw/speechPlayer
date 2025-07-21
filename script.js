
/* Классы для обработки и исключения */
const classesToRead    = ['t220__text','t225','t004','t508','t513.t-section__title',
                          't513__time','t513__title','t431','t195__text',
                          't544__title','t544__descr','t157__text'];
const classesToExclude = ['uc-ctgr-link'];

class SpeechPlayer {
  constructor(playBtn, progressC, progressF) {
    this.playBtn = playBtn;
    this.playIcon = playBtn.querySelector('i');
    this.progressC = progressC;
    this.progressF = progressF;
    this.synth = window.speechSynthesis;

    if (!this.synth) {
      console.error('Speech Synthesis not supported');
      this.playBtn.disabled = true;
      return;
    }

    this.ICON_PLAY = 'icon-play';
    this.ICON_PAUSE = 'icon-pause';

    this.utter = null;
    this.fullText = '';
    this.startOffset = 0;
    this.voices = [];

    this.init();
  }

  init() {
    this.playBtn.addEventListener('click', this.handlePlayPause.bind(this));
    this.progressC.addEventListener('click', this.handleProgressClick.bind(this));
    window.addEventListener('beforeunload', () => {
      this.synth.cancel();
    });
  }

  getWordIndexAtChar(charIndex) {
    const words = Array.from(document.querySelectorAll('.word'));
    let currentChar = 0;
    for (let i = 0; i < words.length; i++) {
      const word = words[i].textContent;
      if (charIndex >= currentChar && charIndex < currentChar + word.length) {
        return i;
      }
      currentChar += word.length + 1; // +1 for the space
    }
    return -1;
  }


  buildSelector(list) {
    return list.map(cls => cls.split(/\s+/).map(c => `[class~="${c}"]`).join('')).join(',');
  }

  collectText() {
    if (this.fullText) return this.fullText;

    const readSel = this.buildSelector(classesToRead);
    const skipSel = this.buildSelector(classesToExclude);
    const nodes = document.querySelectorAll(readSel);
    const skipSet = new Set(document.querySelectorAll(skipSel));

    let wordCount = 0;
    const wrapWords = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          const words = text.split(/\s+/);
          const fragment = document.createDocumentFragment();
          words.forEach(word => {
            const span = document.createElement('span');
            span.className = 'word';
            span.id = `word-${wordCount++}`;
            span.textContent = word;
            fragment.appendChild(span);
            fragment.appendChild(document.createTextNode(' '));
          });
          node.parentNode.replaceChild(fragment, node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE && !skipSet.has(node) && !node.closest(skipSel)) {
        Array.from(node.childNodes).forEach(wrapWords);
      }
    };

    nodes.forEach(n => {
      if (!skipSet.has(n) && !n.closest(skipSel)) {
        wrapWords(n);
      }
    });

    this.fullText = Array.from(document.querySelectorAll('.word')).map(el => el.textContent).join(' ').replace(/\s+/g, ' ').trim();
    return this.fullText;
  }

  setUI(state) {
    this.playIcon.classList.remove(this.ICON_PLAY, this.ICON_PAUSE);
    this.playIcon.classList.add(state === 'pause' ? this.ICON_PAUSE : this.ICON_PLAY);
    this.playBtn.title = state === 'pause' ? 'Пауза' : 'Воспроизвести';
  }

  disableBtn(d = true) {
    this.playBtn.disabled = d;
  }

  setProgress(p) {
    this.progressF.style.width = Math.min(p, 100) + '%';
  }

  speakFrom(offset = 0) {
    this.disableBtn(true);
    this.synth.cancel();
    setTimeout(() => {
      this.collectText();
      if (!this.fullText) {
        console.log('Нет текста');
        this.setUI('stop');
        this.disableBtn(false);
        return;
      }

      const textToSpeak = this.fullText.slice(offset);
      this.utter = new SpeechSynthesisUtterance(textToSpeak);

      this.utter.onstart = () => {
        this.setUI('pause');
        this.disableBtn(false);
      };
      this.utter.onend = () => {
        this.setUI('stop');
        this.setProgress(100);
        setTimeout(() => this.setProgress(0), 300);
        this.startOffset = 0;
        const wordSpans = document.querySelectorAll('.word');
        wordSpans.forEach(span => span.classList.remove('highlight'));
      };
      this.utter.onboundary = e => {
        if (e.name === 'word') {
          const wordIndex = this.getWordIndexAtChar(e.charIndex + offset);
          if (wordIndex !== -1) {
            const wordSpans = document.querySelectorAll('.word');
            wordSpans.forEach(span => span.classList.remove('highlight'));
            const wordSpan = document.getElementById(`word-${wordIndex}`);
            if (wordSpan) {
              wordSpan.classList.add('highlight');
            }
          }
          const globalIndex = offset + e.charIndex + e.charLength;
          this.setProgress((globalIndex / this.fullText.length) * 100);
        }
      };

      this.synth.speak(this.utter);
    }, 50);
  }

  handlePlayPause() {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.setUI('play');
    } else if (this.synth.paused) {
      this.synth.resume();
      this.setUI('pause');
    } else {
      this.fullText = ''; // Reset cache
      this.startOffset = 0;
      this.speakFrom(0);
    }
  }

  handleProgressClick(e) {
    const rect = this.progressC.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newOffset = Math.floor(ratio * this.fullText.length);

    this.startOffset = newOffset;
    this.speakFrom(newOffset);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const playBtn = document.getElementById('playPauseBtn');
  const progressC = document.getElementById('progressBarContainer');
  const progressF = document.getElementById('progressFill');

  if (playBtn && progressC && progressF) {
    new SpeechPlayer(playBtn, progressC, progressF);
  }
});
