defmodule Golf.Games.Round do
  use Ecto.Schema

  @states [:init, :take, :hold, :flip, :over]

  schema "rounds" do
    field :state, Ecto.Enum, values: @states
    field :turn, :integer
    field :deck, {:array, :string}
    field :table_cards, {:array, :string}
    field :hands, :map

    belongs_to :game, Golf.Games.Game

    timestamps(type: :utc_datetime)
  end
end
