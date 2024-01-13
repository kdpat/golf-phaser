defmodule Golf.Repo.Migrations.CreateGames do
  use Ecto.Migration

  def change do
    create table(:games) do
      add :host_id, references(:users, on_delete: :nothing, type: :string)
      timestamps(type: :utc_datetime)
    end

    create index(:games, [:host_id])

    create table(:players) do
      add :turn, :integer
      add :game_id, references(:games)
      add :user_id, references(:users, on_delete: :nothing, type: :string)
      timestamps(type: :utc_datetime)
    end

    create unique_index(:players, [:game_id, :user_id])
    create unique_index(:players, [:game_id, :turn])

    create table(:rounds) do
      add :state, :string
      add :turn, :integer
      add :deck, {:array, :string}
      add :table_cards, {:array, :string}
      add :hands, :map
      add :game_id, references(:games)
      timestamps(type: :utc_datetime)
    end

    create index(:rounds, [:game_id])
  end
end
