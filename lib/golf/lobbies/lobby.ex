defmodule Golf.Lobbies.Lobby do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :string, []}

  schema "lobbies" do
    belongs_to :host, Golf.Users.User
    many_to_many :users, Golf.Users.User, join_through: Golf.Lobbies.LobbyUser
    timestamps(type: :utc_datetime)
  end

  def changeset(lobby, attrs \\ %{}) do
    lobby
    |> cast(attrs, [:id])
    |> validate_required([:id])
  end
end
