defmodule Golf.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :session_id, :string
      add :name, :string

      timestamps(type: :utc_datetime)
    end

    create unique_index(:users, [:session_id])
  end
end
