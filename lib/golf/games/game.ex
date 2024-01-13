defmodule Golf.Games.Game do
  use Ecto.Schema
  import Ecto.Changeset

  alias Golf.Users.User

  schema "games" do
    belongs_to :host, Golf.Users.User
    has_many :players, Golf.Games.Player
    has_many :rounds, Golf.Games.Round

    timestamps(type: :utc_datetime)
  end

  def changeset(game, attrs) do
    game
    |> cast(attrs, [:host_id])
    |> cast_assoc(:players)
    |> validate_required([:host_id])
  end

  def new_changeset(%User{} = host) do
    player = %{user_id: host.id, turn: 0}
    params = %{host_id: host.id, players: [player]}

    %__MODULE__{}
    |> cast(params, [:host_id])
    |> cast_assoc(:players)
    |> validate_required([:host_id])
  end
end
