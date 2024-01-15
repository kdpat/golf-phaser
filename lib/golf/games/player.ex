defmodule Golf.Games.Player do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder,
           only: [:id, :turn, :user, :hand, :held_card, :score, :position, :can_act?]}
  schema "players" do
    field :turn, :integer

    belongs_to :game, Golf.Games.Game
    belongs_to :user, Golf.Users.User

    timestamps(type: :utc_datetime)

    # virtual fields
    field :hand, {:array, :map}, virtual: true
    field :held_card, :string, virtual: true
    field :score, :integer, virtual: true
    field :position, :string, virtual: true
    field :can_act?, :boolean, virtual: true
  end

  def changeset(%__MODULE__{} = player, attrs \\ %{}) do
    player
    |> cast(attrs, [:game_id, :user_id, :turn])
    |> validate_required([:user_id, :turn])
  end
end
