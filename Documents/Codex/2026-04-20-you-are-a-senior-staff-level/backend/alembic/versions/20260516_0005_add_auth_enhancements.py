"""add auth enhancements

Revision ID: 20260516_0005
Revises: 20260515_0004
Create Date: 2026-05-16

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260516_0005'
down_revision = '20260515_0004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add email verification fields
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('email_verification_token_hash', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('email_verification_expires_at', sa.DateTime(timezone=True), nullable=True))
    
    # Add password reset token fields (replacing old password_reset_codes table)
    op.add_column('users', sa.Column('password_reset_token_hash', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('password_reset_expires_at', sa.DateTime(timezone=True), nullable=True))
    
    # Add OAuth provider fields
    op.add_column('users', sa.Column('auth_provider', sa.String(50), nullable=True, server_default='email'))
    op.add_column('users', sa.Column('google_id', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('github_id', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('apple_id', sa.String(255), nullable=True))
    
    # Add phone verification fields
    op.add_column('users', sa.Column('phone_number', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('phone_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('phone_verification_code_hash', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('phone_verification_expires_at', sa.DateTime(timezone=True), nullable=True))
    
    # Add security fields
    op.add_column('users', sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('failed_login_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('account_locked_until', sa.DateTime(timezone=True), nullable=True))
    
    # Create indexes for OAuth IDs
    op.create_index('ix_users_google_id', 'users', ['google_id'], unique=False)
    op.create_index('ix_users_github_id', 'users', ['github_id'], unique=False)
    op.create_index('ix_users_apple_id', 'users', ['apple_id'], unique=False)
    op.create_index('ix_users_phone_number', 'users', ['phone_number'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_users_phone_number', table_name='users')
    op.drop_index('ix_users_apple_id', table_name='users')
    op.drop_index('ix_users_github_id', table_name='users')
    op.drop_index('ix_users_google_id', table_name='users')
    
    # Drop columns
    op.drop_column('users', 'account_locked_until')
    op.drop_column('users', 'failed_login_attempts')
    op.drop_column('users', 'last_login_at')
    op.drop_column('users', 'phone_verification_expires_at')
    op.drop_column('users', 'phone_verification_code_hash')
    op.drop_column('users', 'phone_verified')
    op.drop_column('users', 'phone_number')
    op.drop_column('users', 'apple_id')
    op.drop_column('users', 'github_id')
    op.drop_column('users', 'google_id')
    op.drop_column('users', 'auth_provider')
    op.drop_column('users', 'password_reset_expires_at')
    op.drop_column('users', 'password_reset_token_hash')
    op.drop_column('users', 'email_verification_expires_at')
    op.drop_column('users', 'email_verification_token_hash')
    op.drop_column('users', 'email_verified')
