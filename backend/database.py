import os
from sqlalchemy import create_engine, Column, Integer, String, text
from sqlalchemy.orm import sessionmaker, declarative_base
from pgvector.sqlalchemy import Vector
import pandas as pd

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/app_db")

db_engine = create_engine(DATABASE_URL, use_insertmanyvalues=False)
SessionLocal = sessionmaker(bind=db_engine)
Base = declarative_base()


class LoginUser(Base):
    __tablename__ = "login"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password = Column(String(128), nullable=False)  # stores bcrypt hash


class RAGTable(Base):
    __tablename__ = "rag_table"

    id = Column(Integer, primary_key=True, autoincrement=True)
    disease_name = Column(String(), nullable=False, index=True)
    symptoms = Column(String(), nullable=False)
    treatments = Column(String(), nullable=False)
    symptoms_embedding = Column(Vector(384), nullable=False)


def get_db():
    database = SessionLocal()
    try:
        yield database
    finally:
        database.close()


def _get_ollama_client():
    """Lazy-load ollama client so import errors don't crash startup."""
    import ollama
    return ollama.Client(host="http://ollama:11434")


def _load_rag_data():
    """Lazy-load the medical dataset so network fetch doesn't block startup."""
    return pd.read_csv("hf://datasets/QuyenAnhDE/Diseases_Symptoms/Diseases_Symptoms.csv")


def input_rag_data():
    ollama_client = _get_ollama_client()
    medical_rag_data = _load_rag_data()
    db_session = SessionLocal()

    try:
        for row in medical_rag_data.itertuples(index=False):
            embed_response = ollama_client.embeddings(
                model="all-minilm:22m",
                prompt=row.Symptoms
            )
            embedding = [float(x) for x in embed_response["embedding"]]

            new_entry = RAGTable(
                disease_name=row.Name,
                symptoms=row.Symptoms,
                treatments=row.Treatments,
                symptoms_embedding=embedding
            )
            db_session.add(new_entry)
            db_session.flush()

        db_session.commit()

    finally:
        db_session.close()


def init_db():
    with db_engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    Base.metadata.create_all(bind=db_engine)

    db_session = SessionLocal()
    try:
        if db_session.query(RAGTable).first() is None:
            input_rag_data()
    finally:
        db_session.close()


def get_disease_result(user_query: str):
    ollama_client = _get_ollama_client()
    embed_response = ollama_client.embeddings(model='all-minilm:22m', prompt=user_query)
    query_embedding = [float(x) for x in embed_response["embedding"]]
    db_session = SessionLocal()

    try:
        results = (
            db_session.query(
                RAGTable.disease_name,
                RAGTable.symptoms_embedding.cosine_distance(query_embedding).label("distance")
            )
            .order_by(RAGTable.symptoms_embedding.cosine_distance(query_embedding))
            .limit(1)
            .all()
        )
        return results[0].disease_name
    finally:
        db_session.close()


def get_treatments_result(user_query: str):
    ollama_client = _get_ollama_client()
    embed_response = ollama_client.embeddings(model='all-minilm:22m', prompt=user_query)
    query_embedding = [float(x) for x in embed_response["embedding"]]
    db_session = SessionLocal()

    try:
        results = (
            db_session.query(
                RAGTable.treatments,
                RAGTable.symptoms_embedding.cosine_distance(query_embedding).label("distance")
            )
            .order_by(RAGTable.symptoms_embedding.cosine_distance(query_embedding))
            .limit(1)
            .all()
        )
        return results[0].treatments
    finally:
        db_session.close()
