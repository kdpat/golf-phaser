defmodule Golf.Games.Game do
  use Ecto.Schema
  import Ecto.Changeset

  alias Golf.Users.User

  @primary_key {:id, :string, []}

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

  def new_changeset(id, %User{} = host, users) do
    players =
      users
      |> Enum.with_index()
      |> Enum.map(fn {user, i} -> %{user_id: user.id, turn: i} end)

    params = %{id: id, host_id: host.id, players: players}

    %__MODULE__{}
    |> cast(params, [:id, :host_id])
    |> cast_assoc(:players)
    |> validate_required([:id, :host_id])
  end
end
