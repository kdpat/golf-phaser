defmodule Golf.Users.User do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false

  schema "users" do
    field :id, :string, primary_key: true
    field :name, :string

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:id, :name])
    |> validate_required([:id, :name])
  end
end
