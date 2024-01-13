defmodule Golf.Repo.Migrations.CreateGames do
  use Ecto.Migration

  def change do
    create table(:games) do
      add :host_id, references(:users)
      timestamps(type: :utc_datetime)
    end

    create index(:games, [:host_id])

    create table(:players) do
      add :game_id, references(:games)
      add :user_id, references(:users)
      add :turn, :integer
      timestamps(type: :utc_datetime)
    end

    create unique_index(:players, [:game_id, :user_id])
    create unique_index(:players, [:game_id, :turn])

    create table(:rounds) do
      add :game_id, references(:games)
      add :state, :string
      add :turn, :integer
      add :deck, {:array, :string}
      add :table_cards, {:array, :string}
      add :hands, :map
      add :first_player_index, :integer
      timestamps(type: :utc_datetime)
    end

    create index(:rounds, [:game_id])

    create table(:events) do
      add :round_id, references(:rounds)
      add :player_id, references(:players)
      add :action, :string
      add :hand_index, :integer
      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:events, [:round_id])
  end
end
