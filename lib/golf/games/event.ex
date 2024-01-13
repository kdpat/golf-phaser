defmodule Golf.Games.Event do
  use Ecto.Schema
  import Ecto.Changeset

  @actions [:take_deck, :take_table, :swap, :discard, :flip]

  schema "events" do
    field :action, Ecto.Enum, values: @actions
    field :hand_index, :integer

    belongs_to :round, Golf.Games.Round
    belongs_to :player, Golf.Games.Player

    timestamps(type: :utc_datetime, updated_at: false)
  end

  def new(player_id, action, hand_index \\ nil) do
    %__MODULE__{
      player_id: player_id,
      action: action,
      hand_index: hand_index
    }
  end

  def changeset(event, attrs \\ %{}) do
    event
    |> cast(attrs, [:round_id, :player_id, :action, :hand_index])
    |> validate_required([:round_id, :player_id, :action])
  end
end
