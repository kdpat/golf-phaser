defmodule Golf.Games.Round do
  use Ecto.Schema
  import Ecto.Changeset
  alias Golf.Games
  alias Golf.Games.Game

  @decks_to_use 2
  @hand_size 6

  @states [:flip_2, :take, :hold, :flip, :round_over]

  schema "rounds" do
    field :state, Ecto.Enum, values: @states
    field :turn, :integer
    field :deck, {:array, :string}
    field :table_cards, {:array, :string}
    field :hands, :map

    belongs_to :game, Golf.Games.Game
    has_many :events, Golf.Games.Event

    timestamps(type: :utc_datetime)
  end

  def changeset(%__MODULE__{} = round, attrs \\ %{}) do
    round
    |> cast(attrs, [:game_id, :state, :turn, :deck, :table_cards, :hands])
    |> validate_required([:state, :turn, :deck, :table_cards, :hands])
  end

  def new_changeset(%Game{} = game) do
    deck =
      Games.new_deck(@decks_to_use)
      |> Enum.shuffle()

    num_hand_cards = @hand_size * length(game.players)
    {:ok, hand_cards, deck} = Games.deal_from(deck, num_hand_cards)
    hands = make_hands(hand_cards, game.players)
    
    {:ok, table_card, deck} = Games.deal_from(deck)

    %__MODULE__{
      game_id: game.id,
      state: :flip_2,
      turn: 0,
      deck: deck,
      table_cards: [table_card],
      hands: hands
    }
    |> changeset()
  end

  defp make_hands(cards, players) do
    cards
    |> Enum.map(fn name -> %{"name" => name, "face_up?" => false} end)
    |> Enum.chunk_every(@hand_size)
    |> Enum.zip(player_ids(players))
    |> Enum.reduce(%{}, fn {hand, id}, acc -> Map.put(acc, id, hand) end)
  end

  defp player_ids(players) do
    Enum.map(players, fn p -> Integer.to_string(p.id) end)
  end
end
