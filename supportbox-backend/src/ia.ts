// Nesse fonte está a implementação do agente de IA do projeto, utilizando Gemini 2.5 flash, como API está sendo utilizada a própria do gemini que já vem pré-parametrizada e está dentro da biblioteca @google/genai. Nesse fonte é definido somente o modelo e a chave.

import { GoogleGenAI } from "@google/genai"; // importa a classe GoogleGenAI da biblioteca @google/genai, que é usada para interagir com o modelo de IA Gemini 2.5 flash.

const chave = process.env.GEMINI_API_KEY; // declara a constante 'chave' e atribui a ela o valor da variável de ambiente GEMINI_API_KEY, que deve conter a chave de API para acessar o modelo de IA.

//verifica se a chave de API não está definida. Se não estiver, lança um erro informando que a chave está ausente e instruindo o usuário a defini-la no arquivo .env, além de fornecer um link para obter a chave.
if (!chave) {
  throw new Error(
    "GEMINI_API_KEY ausente. Defina a chave no arquivo .env " +
      "(veja o .env.example). Pegue a sua em https://aistudio.google.com/apikey",
  );
}

export const MODELO_IA = "gemini-2.5-flash"; // Declara a constante MODELO_IA e atribui a ela o modelo que vamos usar. O export permite que outros arquivos do backend importem essa constante.

export const ia = new GoogleGenAI({ apiKey: chave }); //Declara a constante ia e instancia um objeto GoogleGenAI, passando a chave da API na construção.
