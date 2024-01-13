defmodule Golf.Games.Player do
  use Ecto.Schema
  import Ecto.Changeset

  schema "players" do
    field :turn, :integer

    belongs_to :game, Golf.Games.Game
    belongs_to :user, Golf.Users.User

    timestamps(type: :utc_datetime)
  end

  def changeset(%__MODULE__{} = player, attrs \\ %{}) do
    player
    |> cast(attrs, [:game_id, :user_id, :turn])
    |> validate_required([:user_id, :turn])
  end
end
