defmodule Golf.Users.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :session_id, :string
    field :name, :string

    timestamps(type: :utc_datetime)
  end

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:session_id, :name])
    |> validate_required([:session_id, :name])
  end
end
