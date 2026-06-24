from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

mongo_uri = os.getenv("MONGODB_URI")

print("MONGO URI:", mongo_uri)

client = MongoClient(mongo_uri)

print("DATABASES:", client.list_database_names())

db = client["ai_career_assistant"]

print("CURRENT DB:", db.name)

users = db["users"]

print("USERS COUNT:", users.count_documents({}))

print("MongoDB Connected Successfully")