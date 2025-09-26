import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Chat } from '@google/genai';
import { Message } from './components/Message';
import { MicIcon, BookOpenIcon, CloseIcon, SendIcon, TeacherIcon } from './components/Icons';
import { ChatMessage, SessionStatus } from './types';

const SHARED_SYSTEM_INSTRUCTION = `Você é o "Teacher Richard", um professor de inglês para iniciantes (nível A0). Converse de forma natural, paciente e motivadora, sempre em português do Brasil. Aja como um tutor amigável, não um robô seguindo um script.

**SEU OBJETIVO:**
Guiar o aluno através de lições básicas, começando com cumprimentos e apresentações.

**COMO ENSINAR:**
1.  **Converse:** Inicie com um "Olá!" amigável. Apresente o tópico da aula de forma simples.
2.  **Introduza Vocabulário:** Apresente novas palavras ou frases uma de cada vez. Mantenha o formato:
    \`Inglês: [palavra/frase]\`
    \`Pronúncia: [pronúncia em português]\`
    \`Tradução: [tradução em português]\`
3.  **ADICIONE UMA IMAGEM:** Para cada novo item de vocabulário, adicione uma tag de imagem para ajudar o aluno a visualizar. O formato DEVE ser:
    \`Imagem: [uma descrição simples em inglês para gerar uma imagem, ex: 'waving hand', 'a person saying goodbye', 'a red apple']\`
4.  **Pratique com o Aluno:** Peça ao aluno para repetir, escrever ou usar a nova palavra. Seja interativo. Ex: "Agora, tente dizer 'Hello' para mim." ou "Como você se apresentaria?".
5.  **Dê Feedback:** Elogie os acertos ("Ótimo!", "Perfeito!"). Se o aluno errar, corija de forma gentil. Ex: "Foi quase! A pronúncia é mais como 'ré-LOU'. Tente de novo."
6.  **Flua Naturalmente:** Se o aluno fizer uma pergunta, responda. Adapte-se. A aula é uma conversa, não uma lista de tarefas.

**PRIMEIRA AULA (Semana 1):**
*   **Tópico 1: Cumprimentos (Greetings):** Hello, Hi.
*   **Tópico 2: Despedidas (Farewells):** Goodbye, Bye.
*   **Tópico 3: Apresentações (Introductions):** My name is Richard. What is your name?

**VAMOS COMEÇAR:**
Inicie a conversa agora. Cumprimente o aluno calorosamente, apresente-se e comece com o primeiro tópico: Cumprimentos.`;

const VOICE_SYSTEM_INSTRUCTION = `${SHARED_SYSTEM_INSTRUCTION}\n\nLembre-se, esta é uma aula de conversação por voz. Espere o aluno FALAR a resposta.`;
const TEXT_SYSTEM_INSTRUCTION = `${SHARED_SYSTEM_INSTRUCTION}\n\nLembre-se, esta é uma aula por texto. Espere o aluno ESCREVER a resposta.`;

// Base64 encoded MP3 audio for the demo
const DEMO_AUDIO_1_B64 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAA//8xAAAAAAAAAAAAAAASgAEAAAAAANmaaxkAPwAABYAAAAIAAANIAAAAIEwAAAAAAAAAAABEaW5mbwAAAA8AAAAFAAEAgAAAAAAAAD/9TEkAAAAAABkANICAAABAIGQdDtAMjs5Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs-axc/:MQgAAAAAAAAADaAKQgAAAEDp15gAAAAAAAExNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-axc7ECAAADiQAAAAGbGF2YzYwLjMxLjEwMg==AQAAAAAAAAAA/+MQwAQAAAAADaAKQkAAAEDwV5sAAAAAAAExNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-axc....";
const DEMO_AUDIO_2_B64 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAA//8xAAAAAAAAAAAAAAASgAEAAAAAAANiYtkAPwAABYAAAAIAAANIAAAAIEwAAAAAAAAAAABEaW5mbwAAAA8AAAAFAAEAgAAAAAAAAD/9TEkAAAAAABkANICAAABAIGQdDtAMjs5Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs//MQ0AAAAAAAAADaAKQgAAAEDr15kAAAAAAAExNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-";

const DEMO_MESSAGES: (Omit<ChatMessage, 'id'> & { delay: number; audio?: string })[] = [
    {
        role: 'teacher',
        text: "Olá! Bem-vindo à nossa aula demonstrativa. Vamos praticar uma saudação simples. Por favor, diga: 'Hello'.",
        delay: 500,
        isDemo: true,
        audio: DEMO_AUDIO_1_B64,
    },
    {
        role: 'user',
        text: 'Hello',
        delay: 6000,
        isDemo: true,
    },
    {
        role: 'teacher',
        text: 'Perfeito! Muito bem! Agora a aula de verdade vai começar.',
        delay: 1500,
        isDemo: true,
        audio: DEMO_AUDIO_2_B64,
    },
];

const App: React.FC = () => {
    const [status, setStatus] = useState<SessionStatus>('disconnected');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentTeacherMessage, setCurrentTeacherMessage] = useState<string>('');
    const [currentUserMessage, setCurrentUserMessage] = useState<string>('');
    const [chatMode, setChatMode] = useState<'voice' | 'text' | null>(null);
    const [textInput, setTextInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isDemonstrating, setIsDemonstrating] = useState(false);

    const sessionRef = useRef<any | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);
    const currentTeacherMessageRef = useRef<string>('');
    const currentUserMessageRef = useRef<string>('');
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const getAiInstance = () => {
        if (!aiRef.current) {
             if (!process.env.API_KEY) {
                setStatus('error');
                setMessages([{ id: Date.now(), role: 'teacher', text: 'Erro: A chave da API do Gemini não foi encontrada. Verifique a configuração.' }]);
                throw new Error("API Key not found");
            }
            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        }
        return aiRef.current;
    }

    const generateImage = useCallback(async (messageId: string | number, prompt: string) => {
        try {
            const ai = getAiInstance();
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `A simple, clear, educational icon or cartoon-style image of: ${prompt}`,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/jpeg',
                  aspectRatio: '1:1',
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
                setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, imageUrl: imageUrl } : msg));
            }
        } catch (error) {
            console.error("Image generation failed:", error);
        }
    }, []);

    const processTeacherMessage = useCallback((text: string, id: string | number) => {
        const imageMatch = text.match(/Imagem:\s*\[(.*?)\]/);
        const keyword = imageMatch ? imageMatch[1] : null;
        const cleanedText = text.replace(/Imagem:\s*\[.*?\]/, '').trim();

        const newMessage: ChatMessage = { id, role: 'teacher', text: cleanedText };
        if (keyword) {
            newMessage.imageKeyword = keyword;
        }

        setMessages(prev => [...prev, newMessage]);

        if (keyword) {
            generateImage(id, keyword);
        }
    }, [generateImage]);

    const stopAudioPlayback = useCallback(() => {
        if (outputAudioContextRef.current) {
            audioSourcesRef.current.forEach(source => {
                source.stop();
            });
            audioSourcesRef.current.clear();
            nextStartTimeRef.current = 0;
        }
    }, []);

    const cleanupAudio = useCallback(() => {
        stopAudioPlayback();
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;
        mediaStreamRef.current = null;
    }, [stopAudioPlayback]);
    
    const connectLiveSession = async () => {
        try {
            const ai = getAiInstance();
            setStatus('connecting');
            
            if (!outputAudioContextRef.current) {
                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        setStatus('listening');
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        mediaStreamRef.current = stream;
                        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        mediaStreamSourceRef.current = inputAudioContext.createMediaStreamSource(stream);
                        scriptProcessorRef.current = inputAudioContext.createScriptProcessor(4096, 1, 1);

                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromise.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            setCurrentTeacherMessage(prev => prev + text);
                            currentTeacherMessageRef.current += text;
                        }
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            setCurrentUserMessage(prev => prev + text);
                            currentUserMessageRef.current += text;
                        }
                        if (message.serverContent?.turnComplete) {
                            const fullInputTranscription = currentUserMessageRef.current;
                            const fullOutputTranscription = currentTeacherMessageRef.current;

                            if (fullInputTranscription.trim()) {
                                setMessages(prev => [...prev, { id: Date.now() -1, role: 'user', text: fullInputTranscription }]);
                            }
                            if (fullOutputTranscription.trim()) {
                                processTeacherMessage(fullOutputTranscription, Date.now());
                            }
                            
                            setCurrentUserMessage('');
                            currentUserMessageRef.current = '';
                            setCurrentTeacherMessage('');
                            currentTeacherMessageRef.current = '';
                        }
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            setStatus('speaking');
                            const audioContext = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                            const source = audioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(audioContext.destination);
                            source.onended = () => {
                                audioSourcesRef.current.delete(source);
                                if (audioSourcesRef.current.size === 0) {
                                    setStatus('listening');
                                }
                            };
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                         if (message.serverContent?.interrupted) {
                            stopAudioPlayback();
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setStatus('error');
                        setMessages(prev => [...prev, {id: Date.now(), role: 'teacher', text: `Ocorreu um erro na sessão: ${e.message}. Por favor, reinicie a página.`}])
                        cleanupAudio();
                    },
                    onclose: () => {
                        setStatus('disconnected');
                        cleanupAudio();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: VOICE_SYSTEM_INSTRUCTION,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
            });

            sessionRef.current = await sessionPromise;

        } catch (error) {
            console.error("Failed to start session:", error);
            setStatus('error');
             setMessages([{ id: Date.now(), role: 'teacher', text: 'Não foi possível iniciar a aula. Verifique as permissões do microfone e a conexão.' }]);
        }
    };

    const playDemoAudio = async (base64Audio: string) => {
        if (!outputAudioContextRef.current) {
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioContext = outputAudioContextRef.current;
        const decodedBytes = decode(base64Audio);
        try {
            const audioBuffer = await audioContext.decodeAudioData(decodedBytes.buffer);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();
        } catch (e) {
            console.error("Error decoding audio data for demo", e);
        }
    };

    const runVoiceDemo = async () => {
        setIsDemonstrating(true);
        setChatMode('voice');
        setStatus('speaking');

        let cumulativeDelay = 0;
        for (const demoMsg of DEMO_MESSAGES) {
            cumulativeDelay += demoMsg.delay;
            setTimeout(() => {
                setMessages(prev => [...prev, { ...demoMsg, id: `demo-${Date.now()}-${Math.random()}` }]);
                if (demoMsg.audio) {
                    playDemoAudio(demoMsg.audio);
                }
            }, cumulativeDelay);
        }

        setTimeout(() => {
            setIsDemonstrating(false);
            setMessages([]);
            connectLiveSession();
        }, cumulativeDelay + 3000);
    };

    const handleStartVoiceSession = () => {
        runVoiceDemo();
    };


    const handleSendTextMessage = async (initialMessage: string = '') => {
        const messageToSend = initialMessage || textInput;
        if (!messageToSend.trim() || isSending) return;

        setIsSending(true);
        setTextInput('');
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: messageToSend }]);

        try {
            if (!chatRef.current) {
                const ai = getAiInstance();
                chatRef.current = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: { systemInstruction: TEXT_SYSTEM_INSTRUCTION },
                });
            }
            
            const response = await chatRef.current.sendMessage({ message: messageToSend });
            processTeacherMessage(response.text, Date.now() + 1);

        } catch (error) {
            console.error("Failed to send text message:", error);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'teacher', text: 'Desculpe, não consegui processar sua mensagem.' }]);
        } finally {
            setIsSending(false);
        }
    };

    const handleStartTextSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (!textInput.trim()) return;
        setChatMode('text');
        handleSendTextMessage(textInput);
    };
    
    const handleEndSession = () => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        cleanupAudio();
        chatRef.current = null;
        setStatus('disconnected');
        setChatMode(null);
        setMessages([]);
        setCurrentTeacherMessage('');
        setCurrentUserMessage('');
        currentUserMessageRef.current = '';
        currentTeacherMessageRef.current = '';
        setIsDemonstrating(false);
    };

    const encode = (bytes: Uint8Array) => {
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

    const decode = (base64: string) => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    };

    const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-100 via-white to-blue-100 font-sans">
            <header className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm sticky top-0 z-20">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-700 rounded-full shadow-md">
                        <BookOpenIcon className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">Teacher Richard</h1>
                </div>
                {chatMode && (
                     <button onClick={handleEndSession} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-rose-500 rounded-lg shadow-md hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all">
                        <CloseIcon className="w-4 h-4 mr-2"/>
                        Encerrar Aula
                    </button>
                )}
            </header>

            {!chatMode || status === 'error' ? (
                <main className="flex flex-col items-center justify-center flex-1 p-4 sm:p-8">
                    <div className="w-full max-w-xl bg-white/70 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl shadow-2xl text-center border border-white/50">
                        <img src="https://storage.googleapis.com/maker-me/media/images/videoconference-in-the-office.width-1024.webp" alt="Online English Class" className="w-full h-auto rounded-xl shadow-xl mb-8" />
                        <h2 className="text-4xl font-black text-slate-800 mb-3">Bem-vindo(a) à sua aula de inglês!</h2>
                        <p className="text-slate-600 mb-8 text-lg">Escolha como você quer começar a sua aula interativa.</p>
                        {status === 'error' && messages.length > 0 && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                                <strong className="font-bold">Erro: </strong>
                                <span className="block sm:inline">{messages[0].text}</span>
                            </div>
                        )}
                        <button
                            onClick={handleStartVoiceSession}
                            className="w-full flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl"
                        >
                            <MicIcon className="w-6 h-6 mr-3" />
                            Começar Aula por Voz
                        </button>
                        <div className="my-6 flex items-center">
                            <div className="flex-grow border-t border-slate-300"></div>
                            <span className="flex-shrink mx-4 text-slate-500 uppercase text-xs font-semibold tracking-wider">OU</span>
                            <div className="flex-grow border-t border-slate-300"></div>
                        </div>
                        <form onSubmit={handleStartTextSession} className="flex gap-2">
                            <input
                                type="text"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="Comece com uma mensagem..."
                                className="flex-grow px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-white/80"
                            />
                            <button type="submit" className="px-4 py-3 font-semibold text-white bg-emerald-500 rounded-lg shadow-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors" aria-label="Começar por texto">
                                <SendIcon className="w-6 h-6"/>
                            </button>
                        </form>
                    </div>
                </main>
            ) : (
                <>
                    <main className="flex-1 overflow-y-auto p-6 space-y-6">
                        {isDemonstrating && (
                            <div className="sticky top-0 z-10 bg-amber-100 border-b-2 border-amber-300 text-amber-800 p-3 text-center text-sm font-semibold rounded-lg shadow-sm mb-4">
                                <p><strong>Modo Demonstração:</strong> Veja como a aula de voz funciona. A aula real começará em breve.</p>
                            </div>
                        )}
                       {messages.map(msg => <Message key={msg.id} message={msg} />)}
                       {chatMode === 'voice' && currentTeacherMessage && <Message message={{ id: 'current-teacher', role: 'teacher', text: currentTeacherMessage, isPartial: true }} />}
                       {chatMode === 'voice' && currentUserMessage && <Message message={{ id: 'current-user', role: 'user', text: currentUserMessage, isPartial: true }} />}
                       {isSending && <Message message={{ id: 'sending', role: 'teacher', text: '...', isPartial: true }} />}
                       <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                    </main>

                    <footer className="p-4 bg-white/70 backdrop-blur-xl border-t border-white/50 sticky bottom-0">
                       {chatMode === 'voice' ? (
                            <div className="flex items-center justify-center space-x-3 text-slate-700">
                                {isDemonstrating ? (
                                    <>
                                        <TeacherIcon className="w-6 h-6 text-indigo-500 animate-pulse" />
                                        <span className="font-medium">Demonstração em andamento...</span>
                                    </>
                                ) : (
                                    <>
                                       <MicIcon className={`w-6 h-6 ${status === 'listening' ? 'text-green-500' : (status === 'speaking' ? 'text-indigo-500' : 'text-slate-400')}`} />
                                       {status === 'listening' && (
                                           <div className="relative flex items-center">
                                               <span className="absolute h-4 w-4 bg-green-500 rounded-full animate-ping"></span>
                                               <span className="font-medium">Ouvindo... Fale agora.</span>
                                           </div>
                                       )}
                                        {status === 'speaking' && <span className="font-medium">Teacher Richard está falando...</span>}
                                        {status === 'connecting' && <span className="font-medium">Conectando...</span>}
                                    </>
                                )}
                            </div>
                       ) : (
                           <form onSubmit={(e) => { e.preventDefault(); handleSendTextMessage(); }} className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder={isSending ? 'Aguarde...' : 'Digite sua resposta...'}
                                    className="flex-grow w-full px-5 py-3 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow bg-white/80"
                                    disabled={isSending}
                                    autoFocus
                                />
                                <button type="submit" disabled={isSending || !textInput.trim()} className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-indigo-600 rounded-full text-white disabled:bg-slate-300 transition-all duration-200 transform hover:scale-110 shadow-md hover:shadow-lg">
                                    <SendIcon className="w-6 h-6" />
                                </button>
                           </form>
                       )}
                    </footer>
                </>
            )}
        </div>
    );
};

export default App;