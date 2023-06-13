/* 
Author: Lucca de Mello

This is the script for the Como Fala web app. 
For a description of the app, see index.html.

A few examples to try out:
English
California
abbot
intonation
consume
watermelon
bottle
button
uh-oh
bon vivant
*/

(() => {
'use strict';

const DEBUG = false;

// See `catchFetchError` function.
const errorMessage = new Map([
    ['REQUEST_FAILED', 'Não consegui comunicar com o servidor.'],
    ['WORD_NOT_FOUND', 'Essa palavra não foi encontrada.'],
    ['NO_PRONUNCIATION', 'Como Fala não tem a pronúncia dessa palavra.'],
    ['DEFAULT', 'Alguma coia deu errado.']
]);

const ipaToPortugueseMap = new Map([
    /* Part 1: Multi-letter sounds. These come first so that they are parsed 
    with a higher precendence order. They are replaced with a non-terminal 
    symbol ($1, $2, etc.), which is later replaced by the appropriate terminal 
    symbol (see part 3). This prevents replacement sequences, e.g. 
    (au̇ -> au -> éu) and (zh -> j -> dj), from happening. */

    /* Part 1a: Multi-letter sounds that exist in Portuguese. */
    ['au̇', '$1'],
    ['ch', '$2'],
    ['sh', '$3'],
    ['zh', '$4'],

    /* Part 1b: Multi-letter sounds that don't exist in Portuguese. 
    Rough approximations are the best we can do. */
    ['th', 'f'], // E.g. "thing" -> "fing".
    ['t͟h', 'd'], // E.g. "this"  -> "dis".
    
    /* Part 2: Single-letter sounds. */
    ['a', 'é'],
    ['ä', 'ó'],
    ['ā', 'ê'],
    ['ə', 'ã'],
    ['ᵊ', '(ã)'],
    ['ē', 'íi'],
    ['ī', 'ai'],
    ['ȯ', 'ó'],
    ['ō', 'ou'],
    ['œ', 'ou'],
    ['u̇', 'u'],
    ['ü', 'úu'],
    ['j', 'dj'],
    ['ŋ', 'nh'],
    ['ⁿ', 'n'],
    ['(t)', ''],
    ['w', 'u'],
    ['y', 'i'],

    /* Part 3: Replacing the non-terminal symbols. */
    ['$1', 'au'],
    ['$2', 'tch'],
    ['$3', 'x'],
    ['$4', 'j'],

    /* Part 4: Remove special characters. */

    ['ˈ', ''], /* This marks the stressed syllable. After finding it (see 
                  stressedSyllable), we no longer need it. */

    ['ˌ', ''], /* TODO: add extra margin before syllables that start with "ˌ"? 
                  E.g. ˈwȯtərˌmelən -> wó tãr ˌmé lãn -> wó tãr   mé lãn */

    ['()', ''] /* Some words, like "haha", start with "(ˈ)". 
                  And some others, like "deinstitutionalization", 
                  start with "(ˌ)". */
]);

/**
 * Throws an error if the `assertion` fails.
 * @param {bool} assertion Condition to test. If this is `false`, 
 * the error is thrown.
 * @param {string} msg The error message.
 */
function assert(assertion, msg) {
    if (!assertion) throw new Error(msg);
}

/**
 * Gets the "Merriam-Webster's Collegiate Dictionary With Audio" URL for `word`.
 * @param {string} word The English word to be requested.
 * @returns {string} The URL where the JSON data for `word` is stored.
 */
function getWordURL(word) {
    const apiKey = '50a710bc-075e-41b4-a3f9-ca4508abbc93';
    return `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${apiKey}`;
}

/**
 * ~Gets the "Merriam-Webster's Collegiate Dictionary With Audio" URL for the 
 * audio transcription `audioId`.~ This function currently doesn't do anything.
 * @param {string} audioId The API-designated ID of the audio transcription, 
 * e.g. "pajama02".
 * @returns {string} ~The URL where the audio transcription is stored.~
 */
function getAudioURL(audioId) {
    return "";
}

/**
 * 
 * @param {string} ipa 
 */
function splitIPA(ipa) {
            /* Some words, like "squirrel", split a paranthesized phoneme 
               between two syllables. */
    return ipa.replaceAll('(-', '-(')
            /* Thankfully, the separator for IPA syllabifications is 
               always "-". */
              .split('-')
            /* The .filter is here because the IPA syllabification of a few 
               words ends in "-", for some reason. */
              .filter(syl => syl != "");
}

/**
 * Finds the index of the stressed syllable of a word.
 * @param {string[]} ipaSyllables Syllables of the word in the IPA, 
 * e.g. `["pə", "ˈjä", "mə"]`.
 * @returns {number} The index of the stressed syllable, 
 * e.g. 2 for `ipaSyllables == ["pə", "ˈjä", "mə"]`.
 */
function findStress(ipaSyllables) {
    return ipaSyllables.findIndex(syllable => syllable[0] == "ˈ");
}

/**
 * Converts text using International Phonetic Alphabet characters to text 
 * using Portuguese characters.
 * @param {string} ipa Text in the International Phonetic Alphabet.
 * @returns {string} A Portuguese transliteration of the IPA text.
 */
function ipaToPortuguese(ipa) {
    for (const [find, replace] of ipaToPortugueseMap.entries()) {
        ipa = ipa.replaceAll(find, replace)
    }
    return ipa;
}

/**
 * Returns a wrapper element for a word syllable.
 * @param {string} syllable The syllable to be displayed in the element.
 * @param {bool} isStressed Whether this syllable is the stressed syllable of 
 * the word, of which there is only one.
 * @returns {HTMLElement} A `<td>` containing the `syllable`.
 */
function generateSyllableContainer(syllable, isStressed) {
    const container = document.createElement('td');

    if (isStressed) {
        /* For accessibility, wrap the stressed syllable in an `<em>` 
        instead of just adding a class to the <td>. */
        const em = document.createElement('em');
        em.textContent = syllable;
        container.appendChild(em);
    } else {
        container.textContent = syllable;
    }

    return container;
}

/**
 * Returns a `<tr>` containing the `syllables`. 
 * @param {string[]} syllables The syllables, each of which will be wrapped in 
 * its own sub-container (generated by `generateSyllableContainer`).
 * @param {number} stressIndex The index of the stressed syllable. The 
 * `stressIndex`th syllable container (see `generateSyllableContainer`) is 
 * distingued as such.
 * @returns {HTMLElement} The `<tr>`.
 */
function generateSyllabificationContainer(syllables, stressIndex) {
    const container = document.createElement('tr');

    syllables.forEach((syl, i) => 
        container.appendChild
            (generateSyllableContainer(syl, i == stressIndex)));

    return container;
}

/**
 * Display the syllabifications of the word, wrapped in the appropriate 
 * containers.
 * @param {string[][]} syllabifications
 * @param {number} stressIndex
 */
function showSyllabifications(syllabifications, stressIndex) {
    /* FIXME: some words, like "audio" and "electroencephalograph", 
     * have an inconsistent number of syllables. Maybe a <table> is not the 
     * best approach? */

    const table = document.getElementById('syllabifications');
    table.innerHTML = '';

    syllabifications
        .map(syllables => 
                generateSyllabificationContainer(syllables, stressIndex))
        .forEach(container => table.appendChild(container));
}

/**
 * Handles the `Promise`d response from the `fetch` request.
 * @param {Response} response The `fetch` response.
 * @returns {Promise} The (promise of the) JSON-converted response.
 */
function toJSON(response) {
    assert(response.ok, 'REQUEST_FAILED');
    return response.json();
}

/**
 * Handles the JSON-converted `fetch` response.
 * @param {any[]} json The JSON response. It is always an Array.
 */
// "thIS fUNctIon is toO LoNG" no it isn't, there's just a lot of documentation.
function handleJSON(json) {
    assert(json.length > 0, 'WORD_NOT_FOUND');

    const firstMeaning = json[0];

    assert(firstMeaning.hasOwnProperty('hwi'), 'WORD_NOT_FOUND');

    const info = firstMeaning.hwi;

    /**
     * E.g. `["pa", "ja", "ma"]` for "pajama".
     */
    /* 
     * Interesting edge case: if the users requests a word that's actally 
     * multiple words, like "bon vivant" or "fin de siècle", 
     * then info.hw == "fin de siè*cle". 
     * Note the use of two different syllable separators, "*" and " ", 
     * hence the use of RegEx in .split.
     * Also, some words (like "uh-oh") use "-" instead of "*" as the syllable 
     * separator.
     */
    const wordSyllables = info.hw.split(/\s|\*|-/);

    assert(info.hasOwnProperty('prs'), 'NO_PRONUNCIATION');

    const pronunciations = info.prs.filter(pr => pr.hasOwnProperty('mw'));
    
    /**
     * International Phonetic Alphabet (IPA) syllabifications, 
     * e.g. `[["pə", "ˈjä", "mə"], ["", "ˈja", ""]]`.
     * 
     * Note that IPA syllabifications after the first one have empty syllables, 
     * which we must infer ourselves from the first syllabification. 
     * In this example, the IPA syllables "pə" and "mə" ar missing from the 
     * second syllabification, and we have to infer them from the first 
     * syllabification.
     */
    const ipaSyllabifications = pronunciations.map(({mw}) => splitIPA(mw));

    const stressIndex = findStress(ipaSyllabifications[0]);

    const ptSyllabifications = ipaSyllabifications.map(ipaSyllables => 
        ipaSyllables.map(ipaToPortuguese));

    // TODO: do something with the audio.
    const audioURLs = pronunciations.map(({sound}) => 
        sound ? getAudioURL(sound.audio) : null);
    
    showSyllabifications([wordSyllables, ptSyllabifications[0]], stressIndex)
}

/**
 * Catches errors thrown anywhere in the `fetch` pipeline, 
 * from requesting to displaying the final results.
 * @param {Error} error The thrown error, whose `.message` is translated 
 * via the `errorMessage` module-global `Map`.
 */
function catchFetchError(error) {
    const msg = errorMessage.get(error.message) || errorMessage.get('DEFAULT');
    document.getElementById('error-message').textContent = msg;
    document.querySelector('dialog').showModal();
}

/**
 * `fetch`es the desired word.
 * @param {string} word The word inputted by the user.
 */
function requestWord(word) {
    const url = getWordURL(word);

    const promise = fetch(url).then(toJSON).then(handleJSON);
    if (!DEBUG) promise.catch(catchFetchError);
}

/**
 * Calls `requestWord` on the value of the `<input>`.
 */
function search() {
    const word = document.querySelector('input').value;
    if (word != '') requestWord(word);
}

/**
 * Initial function. Binds event handlers.
 */
function init() {
    document.getElementById('go').addEventListener('click', search);

    document.addEventListener('keydown', e => {
        if (e.key == 'Enter') search();
    });

    document.getElementById('close-dialog').addEventListener('click', () => {
        document.getElementById('error-dialog').close();
    });
}

init();

})();