defmodule Golf.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users, primary_key: false) do
      add :id, :string, primary_key: true
      add :name, :string

      timestamps(type: :utc_datetime)
    end
  end
end
