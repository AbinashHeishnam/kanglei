from sqlalchemy.orm import declarative_base
from sqlalchemy import MetaData

# Force all tables into the "kanglei" schema
metadata = MetaData(schema="kanglei")
Base = declarative_base(metadata=metadata)
