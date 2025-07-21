document.addEventListener('DOMContentLoaded', function () {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playPauseIcon = playPauseBtn.querySelector('i'); 
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressFill = document.getElementById('progressFill');
  
    const ICON_PLAY_CLASS = 'icon-play';
    const ICON_PAUSE_CLASS = 'icon-pause';
  
    const synth = window.speechSynthesis;
    let utterance = null;
    let fullText = '';
  
    // Озвучивание определенных классов и исключения
    const classesToRead = ['t220__text','t225','t004','t508','t513.t-section__title', 't513__time', 't513__title','t431','t195__text','t544__title','t544__descr', 't157__text'];
    const classesToExclude = ['uc-ctgr-link.t004'];
  
    // Собираем текст
    function getTextToSpeak() {
      const readSelector = classesToRead.map(cls => {
        if (cls.includes(' ')) {
          const parts = cls.split(' ');
          return parts.map(part => `.${part}`).join(' ');
        } else {
          return `.${cls}`;
        }
      }).join(', ');
  
      const potentialElements = document.querySelectorAll(readSelector);
      let collectedText = '';
      potentialElements.forEach(element => {
        const hasExcludedClass = classesToExclude.some(cls => {
          if (cls.includes(' ')) {
            const parts = cls.split(' ');
            return element.closest(parts.map(part => `.${part}`).join(' '));
          } else {
            return element.closest(`.${cls}`);
          }
        });
        
        if (!hasExcludedClass) {
          collectedText += element.textContent.trim() + ' ';
        }
      });
      return collectedText;
    }
  
    // Логика плеера
    playPauseBtn.addEventListener('click', () => {
      if (synth.speaking && !synth.paused) {
        synth.pause();
        playPauseIcon.classList.remove(ICON_PAUSE_CLASS);
        playPauseIcon.classList.add(ICON_PLAY_CLASS);
        playPauseBtn.title = 'Воспроизвести';
      }
      else if (synth.paused) {
        synth.resume();
        playPauseIcon.classList.remove(ICON_PLAY_CLASS);
        playPauseIcon.classList.add(ICON_PAUSE_CLASS);
        playPauseBtn.title = 'Пауза';
      }
      else {
        fullText = getTextToSpeak();
        if (fullText.length > 0) {
          startPlayback(fullText);
        } else {
          console.log('Не найден текст для озвучивания.');
        }
      }
    });
  
    function startPlayback(text) {
      synth.cancel();
  
      utterance = new SpeechSynthesisUtterance(text);
      
      utterance.onstart = () => {
          playPauseIcon.classList.remove(ICON_PLAY_CLASS);
          playPauseIcon.classList.add(ICON_PAUSE_CLASS);
          playPauseBtn.title = 'Пауза';
      };
  
      utterance.onend = () => {
        playPauseIcon.classList.remove(ICON_PAUSE_CLASS);
        playPauseIcon.classList.add(ICON_PLAY_CLASS);
        playPauseBtn.title = 'Воспроизвести';
        progressFill.style.width = '0%'; // Сброс прогресса в конце
      };
  
      utterance.onpause = () => {
        playPauseIcon.classList.remove(ICON_PAUSE_CLASS);
        playPauseIcon.classList.add(ICON_PLAY_CLASS);
        playPauseBtn.title = 'Воспроизвести';
      };
  
      utterance.onresume = () => {
        playPauseIcon.classList.remove(ICON_PLAY_CLASS);
        playPauseIcon.classList.add(ICON_PAUSE_CLASS);
        playPauseBtn.title = 'Пауза';
      };
  
      // Обновление прогрессбара
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const progress = (event.charIndex + event.charLength) / fullText.length * 100;
          progressFill.style.width = `${progress}%`;
        }
      };
  
      utterance.lang = 'ru-RU';
      synth.speak(utterance);
    }
  });
  