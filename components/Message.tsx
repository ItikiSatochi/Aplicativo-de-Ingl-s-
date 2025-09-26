import React from 'react';
import { ChatMessage } from '../types';
import { UserIcon, TeacherIcon, SpinnerIcon, ChatBubbleIcon, SoundWaveIcon, TranslateIcon } from './Icons';

interface MessageProps {
    message: ChatMessage & { isPartial?: boolean };
}

export const Message: React.FC<MessageProps> = ({ message }) => {
    const isTeacher = message.role === 'teacher';

    const formatText = (text: string) => {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0 && message.imageKeyword) return null;

        const formattedLines = lines.map((line, index) => {
            const matchIngles = line.match(/^(Inglês|English):\s*(.*)/i);
            if (matchIngles) {
                return (
                    <div key={index} className="flex items-center gap-3">
                        <ChatBubbleIcon className="w-5 h-5 text-indigo-500 flex-shrink-0"/>
                        <p><span className="font-semibold text-slate-700">Inglês:</span> {matchIngles[2]}</p>
                    </div>
                );
            }
            const matchPronuncia = line.match(/^(Pronúncia|Pronunciation):\s*(.*)/i);
            if (matchPronuncia) {
                return (
                     <div key={index} className="flex items-center gap-3">
                        <SoundWaveIcon className="w-5 h-5 text-emerald-500 flex-shrink-0"/>
                        <p><span className="font-semibold text-slate-700">Pronúncia:</span> <i className="text-slate-500">{matchPronuncia[2]}</i></p>
                    </div>
                );
            }
            const matchTraducao = line.match(/^(Tradução|Translation):\s*(.*)/i);
            if (matchTraducao) {
                 return (
                     <div key={index} className="flex items-center gap-3">
                        <TranslateIcon className="w-5 h-5 text-sky-500 flex-shrink-0"/>
                        <p><span className="font-semibold text-slate-700">Tradução:</span> {matchTraducao[2]}</p>
                    </div>
                 );
            }
            return <p key={index} className="text-slate-800">{line}</p>;
        });

        const elements: JSX.Element[] = [];
        let vocabBlock: JSX.Element[] = [];

        const commitVocabBlock = (key: string | number) => {
            if (vocabBlock.length > 0) {
                elements.push(<div key={key} className="my-4 p-4 bg-indigo-50/70 rounded-lg border border-indigo-200 space-y-3">{vocabBlock}</div>);
                vocabBlock = [];
            }
        };
        
        formattedLines.forEach((line, index) => {
            const isVocabLine = line.props.children && typeof line.props.children !== 'string';
            
            if (isVocabLine) {
                 vocabBlock.push(line);
            } else {
                commitVocabBlock(`vocab-${index}`);
                elements.push(line);
            }
        });

        commitVocabBlock('vocab-last');

        return <div className="space-y-2 leading-relaxed">{elements}</div>;
    };
    
    return (
        <div className={`flex items-start gap-3 ${!isTeacher && 'justify-end'}`}>
            {isTeacher && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                   <TeacherIcon className="w-6 h-6"/>
                </div>
            )}
            <div className={`max-w-2xl rounded-2xl ${isTeacher ? 'bg-white shadow-md border border-slate-100' : 'bg-indigo-600 text-white shadow-md'} ${message.isPartial ? 'opacity-70' : ''}`}>
                {message.imageKeyword && !message.imageUrl && (
                     <div className="flex items-center justify-center p-4 bg-slate-100 rounded-t-2xl">
                        <SpinnerIcon className="w-6 h-6 text-slate-400 animate-spin" />
                        <span className="ml-3 text-sm text-slate-500 font-medium">Gerando imagem...</span>
                    </div>
                )}
                {message.imageUrl && (
                    <img src={message.imageUrl} alt={message.imageKeyword} className="w-full h-auto rounded-t-2xl object-cover" />
                )}
                <div className="px-5 py-4">
                    {formatText(message.text)}
                </div>
            </div>
             {!isTeacher && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                    <UserIcon className="w-6 h-6"/>
                </div>
            )}
        </div>
    );
};