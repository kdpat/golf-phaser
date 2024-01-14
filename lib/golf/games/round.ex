defmodule Golf.Games.Round do
  use Ecto.Schema
  import Ecto.Changeset

  @states [:flip_2, :take, :hold, :flip, :round_over]

  schema "rounds" do
    field :state, Ecto.Enum, values: @states
    field :turn, :integer
    field :deck, {:array, :string}
    field :table_cards, {:array, :string}
    field :hands, :map
    field :held_card, :map
    field :first_player_index, :integer

    belongs_to :game, Golf.Games.Game
    belongs_to :first_player_out, Golf.Games.Player
    has_many :events, Golf.Games.Event

    timestamps(type: :utc_datetime)
  end

  def changeset(%__MODULE__{} = round, attrs \\ %{}) do
    round
    |> cast(attrs, [
      :game_id,
      :state,
      :turn,
      :deck,
      :table_cards,
      :hands,
      :held_card,
      :first_player_index,
      :first_player_out_id
    ])
    |> validate_required([:state, :turn, :deck, :table_cards, :hands, :first_player_index])
  end
end
