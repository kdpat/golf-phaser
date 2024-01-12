defmodule Golf.UsersFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Golf.Users` context.
  """

  @doc """
  Generate a user.
  """
  def user_fixture(attrs \\ %{}) do
    {:ok, user} =
      attrs
      |> Enum.into(%{
        name: "some name",
        session_id: "some session_id"
      })
      |> Golf.Users.create_user()

    user
  end
end
