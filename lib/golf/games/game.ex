defmodule Golf.Games.Game do
  use Ecto.Schema
  import Ecto.Changeset

  schema "games" do
    belongs_to :host, Golf.Users.User, type: :string

    has_many :players, Golf.Games.Player

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(game, attrs) do
    game
    |> cast(attrs, [:host_id])
    |> cast_assoc(:players)
    |> validate_required([:host_id])
  end
end
