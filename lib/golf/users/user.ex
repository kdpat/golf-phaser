defmodule Golf.Users.User do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder, only: [:id, :name]}
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

  def username_changeset(%__MODULE__{} = user, attrs) do
    user
    |> cast(attrs, [:username])
    |> validate_length(:username, min: 1, max: 16)
  end
end
