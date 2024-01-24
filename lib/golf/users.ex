defmodule Golf.Users do
  @moduledoc """
  The Users context.
  """

  import Ecto.Query, warn: false
  alias Golf.Repo

  alias Golf.Users.User

  @default_username "user"
  def default_username, do: @default_username

  def list_users do
    Repo.all(User)
  end

  def get_user(id), do: Repo.get(User, id)

  def get_user_by_session_id(session_id) do
    Repo.get_by(User, session_id: session_id)
  end

  def create_user(attrs \\ %{}) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end

  def delete_user(%User{} = user) do
    Repo.delete(user)
  end

  def change_user(%User{} = user, attrs \\ %{}) do
    User.changeset(user, attrs)
  end
end
