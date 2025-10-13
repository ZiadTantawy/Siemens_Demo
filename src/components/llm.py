# from langchain.chat_models import ChatOpenAI
from os import getenv
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
import openai
from langchain_core.prompts.chat import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
import logging
import time

load_dotenv()
llm_api_key = getenv('OPENAI_KEY')
model_name = getenv('MODEL_NAME')
llm = ChatOpenAI(
  openai_api_key=llm_api_key,
  model_name=model_name,
)