export function initChatbot() {
  const toggleBtn = document.getElementById("chatbot-toggle");
  const chatWindow = document.getElementById("chatbot-window");
  const closeBtn = document.getElementById("chatbot-close");
  const messagesContainer = document.getElementById("chatbot-messages");
  const voiceToggleBtn = document.getElementById("voice-toggle");
  const avatar = document.getElementById("sahyog-avatar");
  const chatInput = document.getElementById("chatbot-input") as HTMLInputElement | null;
  const chatSendBtn = document.getElementById("chatbot-send-btn");

  let voiceEnabled = false;
  let voices: SpeechSynthesisVoice[] = [];
  
  // Set up Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  let recognition: any = null;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (chatInput) {
        chatInput.value = transcript;
        submitChat();
      }
    };
  }

  // Ensure voices are loaded
  function loadVoices() {
    voices = window.speechSynthesis.getVoices();
  }
  if (window.speechSynthesis) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  if (!toggleBtn || !chatWindow || !closeBtn || !messagesContainer || !voiceToggleBtn || !avatar) return;

  const villageBoyPopup = document.getElementById("village-boy-popup");

  voiceToggleBtn.addEventListener("click", () => {
    voiceEnabled = !voiceEnabled;
    voiceToggleBtn.classList.toggle("active", voiceEnabled);
    if (!voiceEnabled) {
      window.speechSynthesis.cancel();
      if (recognition) {
        try { recognition.stop(); } catch(e) {}
      }
      villageBoyPopup?.classList.add("hidden");
    } else {
      speakText("Voice mode enabled. I am listening.");
    }
  });

  // Keep a reference to utterances to prevent garbage collection bugs in some browsers
  const activeUtterances: SpeechSynthesisUtterance[] = [];

  function speakText(text: string) {
    if (!voiceEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // stop previous speech
    activeUtterances.length = 0;
    
    // Strip HTML tags for clean speech
    const cleanText = text.replace(/<[^>]*>?/gm, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    activeUtterances.push(utterance);
    
    // Try to find an Indian English voice
    const indianVoice = voices.find(v => v.lang === "en-IN") || voices.find(v => v.name.includes("India"));
    if (indianVoice) utterance.voice = indianVoice;
    
    utterance.onstart = () => {
      if (recognition) {
        try { recognition.stop(); } catch(e) {}
      }
      villageBoyPopup?.classList.remove("hidden");
    };
    
    utterance.onend = () => {
      villageBoyPopup?.classList.add("hidden");
      if (voiceEnabled && recognition) {
        try { recognition.start(); } catch(e) {}
      }
    };

    utterance.onerror = () => {
      villageBoyPopup?.classList.add("hidden");
      if (voiceEnabled && recognition) {
        try { recognition.start(); } catch(e) {}
      }
    };
    
    window.speechSynthesis.speak(utterance);
  }

  // Use a timeout reference to clear previous hide timers if the bot speaks multiple times
  let popupTimeout: number | undefined;

  function triggerConversingPopup(durationMs: number) {
    if (popupTimeout) {
      clearTimeout(popupTimeout);
    }
    villageBoyPopup?.classList.remove("hidden");
    popupTimeout = window.setTimeout(() => {
      villageBoyPopup?.classList.add("hidden");
    }, durationMs);
  }

  toggleBtn.addEventListener("click", () => {
    chatWindow.classList.toggle("hidden");
    if (!chatWindow.classList.contains("hidden") && messagesContainer.children.length === 0) {
      startConversation();
    }
  });

  closeBtn.addEventListener("click", () => {
    chatWindow.classList.add("hidden");
  });

  function addMessage(text: string, sender: "bot" | "user") {
    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-message ${sender}-message`;
    msgDiv.innerHTML = text;
    messagesContainer?.appendChild(msgDiv);
    messagesContainer!.scrollTop = messagesContainer!.scrollHeight;
    
    if (sender === "bot") {
      // Clean text to calculate reading time roughly
      const cleanText = text.replace(/<[^>]*>?/gm, '').trim();
      
      if (voiceEnabled) {
        speakText(text);
      } else {
        // If voice is off, show the popup for an estimated reading time (approx 250 ms per word)
        const wordsCount = cleanText.split(/\s+/).length;
        const duration = Math.min(Math.max(wordsCount * 250, 2000), 8000); // Between 2s and 8s max
        triggerConversingPopup(duration);
      }
    }
  }

  function addOptions(options: { text: string; onClick: () => void }[]) {
    const optionsDiv = document.createElement("div");
    optionsDiv.className = "chat-options";
    
    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "chat-option-btn";
      btn.textContent = opt.text;
      btn.onclick = () => {
        addMessage(opt.text, "user");
        optionsDiv.remove(); // Remove options once selected
        opt.onClick();
      };
      optionsDiv.appendChild(btn);
    });

    messagesContainer?.appendChild(optionsDiv);
    messagesContainer!.scrollTop = messagesContainer!.scrollHeight;
  }

  function startConversation() {
    addMessage("Namaste and welcome to Sahyog 🌟<br>The assistant of Eklavya Career Initiative.<br><br>No barriers. Just belief. Be Eklavya.<br><br>How may I guide you today?", "bot");
    showMainMenu();
  }

  function showMainMenu() {
    addOptions([
      {
        text: "📖 About Us",
        onClick: () => {
          addMessage("<strong>Our Mission</strong><br>We believe talent exists everywhere, but opportunity does not. We aim to bridge that gap through mentorship, skill development, and accessible career resources to help the determined become the exceptional.", "bot");
          addMessage("Inspired by the legendary archer <strong>Eklavya</strong>, our motto is:<br><br><em>'No barriers. Just belief. Be Eklavya.'</em>", "bot");
          showMainMenu();
        }
      },
      {
        text: "🎯 Explore our programs",
        onClick: () => {
          addMessage("We have several wonderful programs designed to empower individuals:", "bot");
          addMessage(`
            <ul>
              <li><strong>Support a Child Build a Dream:</strong> Sponsoring education & prep.</li>
              <li><strong>Samvaad se Safalta:</strong> 52-week English communication program.</li>
              <li><strong>Love Your Career, Mould Your Career:</strong> Career counselling & interview prep.</li>
              <li><strong>Skilling to Learn, Learn to Earn:</strong> Vocational training (AI, ML, Data Analytics).</li>
            </ul>
            <p>You can read the full details in our <a href="#" onclick="document.querySelector('.programs-section').scrollIntoView({behavior: 'smooth'})">Programs Section</a>.</p>
            <p><em>We are proud to partner with Connect Shiksha, Cubicle Buddies, SYJ Roots, Sahara Society, and Naxlogic.</em></p>
          `, "bot");
          showMainMenu();
        }
      },
      {
        text: "👨‍🏫 Know about the founder",
        onClick: () => {
          addMessage(`<img src="/founder pic.webp" alt="Amit Kumar Gupta" style="width:100%; border-radius:8px; margin-bottom:8px;">Eklavya Career Initiative was founded by <strong>Amit Kumar Gupta</strong>.`, "bot");
          addMessage("He is an IT Strategy Consultant, Digital Transformation Expert, and Microsoft Certified Trainer with 18+ years of experience. He is a passionate mentor and career counselor who has conducted workshops across schools, colleges, and universities.", "bot");
          addMessage(`<a href="https://www.linkedin.com/in/amit-kumar-gupta-33464010/" target="_blank" class="chat-link-btn">💼 View LinkedIn Profile</a>`, "bot");
          showMainMenu();
        }
      },
      {
        text: "📞 Contact Us",
        onClick: () => {
          addMessage("We would love to hear from you! You can reach us through any of the following channels:", "bot");
          addMessage(`
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
              <a href="https://wa.me/message/6HYOCZZUFGYUL1" target="_blank" class="chat-link-btn" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);">💬 WhatsApp Us</a>
              <a href="mailto:Amit295@gmail.com" class="chat-link-btn" style="background: linear-gradient(135deg, #EA4335 0%, #C33223 100%);">📧 Email Us</a>
              <a href="https://www.linkedin.com/company/eklavya-career-initiative/?viewAsMember=true" target="_blank" class="chat-link-btn" style="background: linear-gradient(135deg, #0077b5 0%, #005885 100%);">💼 LinkedIn</a>
              <a href="https://www.instagram.com/eklavyainitiative?igsh=em1mazFnOXd2c3Nn" target="_blank" class="chat-link-btn" style="background: linear-gradient(135deg, #e4405f 0%, #833ab4 100%);">📷 Instagram</a>
              <a href="#" onclick="document.getElementById('contact-form-anchor').scrollIntoView({behavior: 'smooth'})" class="chat-link-btn">📝 Contact Form</a>
              <a href="https://forms.gle/gdNgDkvLonB4DPUH6" target="_blank" class="chat-link-btn" style="background: linear-gradient(135deg, #673AB7 0%, #512DA8 100%);">📋 Open Form in New Tab</a>
            </div>
          `, "bot");
          showMainMenu();
        }
      }
    ]);
  }

  function handleUserMessage(msg: string) {
    const text = msg.toLowerCase();
    let response = "";

    if (text.includes("whatsapp") || text.includes("contact") || text.includes("chat") || text.includes("talk") || text.includes("reach") || text.includes("email")) {
      response = "The fastest way to connect is through WhatsApp! <br><br><a href='https://wa.me/message/6HYOCZZUFGYUL1' target='_blank' class='chat-link-btn'>💬 Open WhatsApp Chat</a><br><br>You can also email us at Amit295@gmail.com or call +91-7992348162.";
    } 
    else if (text.includes("support") || text.includes("child") || text.includes("dream")) {
      response = "<strong>Support a Child Build a Dream:</strong> Sponsoring fees for underprivileged, needy yet talented students for school, UG and PG as well as preparation for competitive exams. We provide dedicated financial support and education sponsorship.";
    }
    else if (text.includes("samvaad") || text.includes("safalta")) {
      response = "<strong>Samvaad Se Safalta:</strong> A program to improve spoken English communication with a dedicated 52 weeks of one-on-one engagement (30 minutes per week).";
    }
    else if (text.includes("love your career") || text.includes("counsel") || text.includes("mould") || text.includes("interview") || text.includes("resume") || text.includes("guidance")) {
      response = "<strong>Love Your Career, Mould Your Career:</strong> Career counselling for students in class IX and X for subject selection, options at UG and PG levels, resume building, interview preparation, and thematic sessions on relevant topics.";
    }
    else if (text.includes("skilling") || text.includes("ai") || text.includes("ml") || text.includes("data") || text.includes("earn") || text.includes("vocational")) {
      response = "<strong>Skilling to Learn, Learn to Earn:</strong> Vocational training by industry experts to promote and build job-oriented skills for sustainable careers. This includes new age topics like AI, Machine Learning, Agile Methodology, and Data Analytics.";
    }
    else if (text.includes("program") || text.includes("course") || text.includes("learn") || text.includes("study") || text.includes("offer")) {
      response = "We offer four main comprehensive programs:<br><br><strong>1. Support a Child Build a Dream:</strong> Education sponsorship and financial support for talented students.<br><strong>2. Samvaad Se Safalta:</strong> A 52-week one-on-one English communication program.<br><strong>3. Love Your Career:</strong> Extensive career counselling, subject selection, and interview prep.<br><strong>4. Skilling to Learn:</strong> Vocational training in AI, ML, Data Analytics, and Agile by industry experts.<br><br>You can ask me for more details on any of these!";
    }
    else if (text.includes("founder") || text.includes("amit") || text.includes("who created") || text.includes("owner")) {
      response = "<img src='/founder pic.webp' alt='Amit Kumar Gupta' style='width:100%; border-radius:8px; margin-bottom:8px;'>Eklavya Career Initiative was founded by <strong>Amit Kumar Gupta</strong>, an IT Strategy Consultant and Digital Transformation Expert with 18+ years of experience across the US, Europe, and APAC. He is also a Microsoft Certified Trainer.";
    }
    else if (text.includes("experience") || text.includes("work") || text.includes("job") || text.includes("zycus") || text.includes("infosys")) {
      response = "Amit Kumar Gupta has 18+ years of experience working as a Principal Consultant and Program Manager at companies like Zycus, Infosys, PwC, Ernst & Young, Capgemini, and Deloitte. He specializes in SAP S/4 HANA, ERP implementations, and SaaS solutions.";
    }
    else if (text.includes("education") || text.includes("degree") || text.includes("college") || text.includes("university")) {
      response = "Our founder, Amit Kumar Gupta, holds an MBA in Finance from Great Lakes Institute of Management (2011-2012) and a B.Tech from NIT Bhopal (2003-2007).";
    }
    else if (text.includes("certif") || text.includes("skills")) {
      response = "Amit is highly certified: TOGAF 9 Certified, Prince2 Agile Practitioner, Scrum.org, Be10x AI Tools, SAP Security, and Analytics tools like Power BI/Tableau.";
    }
    else if (text.includes("mission") || text.includes("goal") || text.includes("vision") || text.includes("why")) {
      response = "<strong>Our Mission:</strong> We believe talent exists everywhere, but opportunity does not. We aim to bridge that gap through mentorship, skill development, and accessible career resources to help the determined become the exceptional.";
    }
    else if (text.includes("who is eklavya") || text.includes("legend") || text.includes("archer") || text.includes("inspire") || text.includes("inspiration")) {
      response = "The initiative is inspired by the legendary archer <strong>Eklavya</strong>. Despite having no formal teacher or resources, he overcame barriers through sheer determination and self-learning to become a master. Our motto is: <em>'No barriers. Just belief. Be Eklavya.'</em>";
    }
    else if (text.includes("collab") || text.includes("school") || text.includes("ngo") || text.includes("volunteer") || text.includes("join") || text.includes("help")) {
      response = "We'd love to collaborate! Please email us at Amit295@gmail.com, connect on <a href='https://www.linkedin.com/in/amit-kumar-gupta-33464010/' target='_blank'>LinkedIn</a>, or fill out our <a href='https://forms.gle/gdNgDkvLonB4DPUH6' target='_blank'>Google Form</a>.";
    }
    else if (text.includes("feedback")) {
      response = "We value your feedback! Please fill out our <a href='https://forms.gle/7Z7URBypdJyxy99R8' target='_blank'>Feedback Form</a>.";
    }
    else if (text.includes("hi") || text.includes("hello") || text.includes("hey") || text.includes("namaste")) {
      response = "Namaste! How can I guide you today? I can tell you about our amazing programs, our mission, or the inspiring story of our founder, Amit Kumar Gupta.";
    }
    else {
      response = "That's an interesting question! I am still learning, but you can find detailed information on our website, or you can ask me about our programs, mission, or our founder Amit Kumar Gupta. For direct support, you can reach out to us on <a href='https://wa.me/message/6HYOCZZUFGYUL1' target='_blank'>WhatsApp</a>.";
    }

    setTimeout(() => {
      addMessage(response, "bot");
      setTimeout(() => {
        showMainMenu();
      }, 1000);
    }, 600);
  }

  function submitChat() {
    if (!chatInput) return;
    const msg = chatInput.value.trim();
    if (!msg) return;

    // Remove any options currently displayed
    const optionsDivs = document.querySelectorAll(".chat-options");
    optionsDivs.forEach(div => div.remove());

    addMessage(msg, "user");
    chatInput.value = "";
    handleUserMessage(msg);
  }

  chatSendBtn?.addEventListener("click", submitChat);
  
  chatInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      submitChat();
    }
  });
}
