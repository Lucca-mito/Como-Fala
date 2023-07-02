CS 132, Spring 2022

Submission for Creative Project #3

Author: Lucca de Mello

Instructor: Melissa Hovik

[Try it out!](https://lucca-mito.github.io/Como-Fala)

---

**Como Fala** (Portuguese for "How do you say?") is a web app to help speakers of 
Brazilian Portuguese, such as myself, to learn how to pronounce words in 
English.

This is neither a language-learning app nor a translation app. Such apps 
teach you what the English word is, but not how to pronounce it. This app 
is a complement to these apps: it assumes you know what the English word 
is, and shows you how to pronounce it.

This is usually done using the text-to-speech feature of, say, Google 
Translate. But seeing a textual description of how to pronounce a word in 
addition to hearing it is more helpful than just hearing it. Traditionally, 
this textual description is the purpose of the International Phonetic Alphabet 
(IPA). However, very few (besides linguists) are familiar with it. Even 
fewer have memorized the sometimes-unintuitive sounds made by every single 
IPA character. 

This app is just an IPA transliterator. It fetches an IPA syllabifiction of 
the specified word, then outputs a transliteration that, when read by a 
speaker of Brazilian Portuguese, should resemble what the word sounds like 
in American English. Since these two languages are very different, this 
transliteration is an approximation. (I tried my best.) 

This version does not include audio transcription; I'll implement that in a 
later version. 

**Some words to try out:**
- English
- California
- abbot
- intonation
- consume
- watermelon
- bottle
- button
- uh-oh
- bon vivant